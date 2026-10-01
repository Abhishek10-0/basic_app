import { Image, Text, View, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { ChamberEvent, Plan, News } from "@sme/types";
import { money, date, totals } from "@sme/shared";
import { api } from "../lib/api";
import { useSession } from "../lib/session";
import {
  Screen,
  Card,
  Button,
  styles,
  Skeleton,
  ErrorState,
} from "../components/ui";
export function DetailScreen({
  kind,
}: {
  kind: "events" | "membership" | "news";
}) {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const user = useSession((s) => s.user);
  const path = kind === "membership" ? "membership-plans" : kind;
  const q = useQuery({
    queryKey: [path, slug],
    queryFn: () => api<ChamberEvent | Plan | News>(`/${path}/${slug}`),
  });
  const row = q.data;
  return (
    <Screen
      title={
        kind === "events"
          ? "Event details"
          : kind === "membership"
            ? "Membership details"
            : "Chamber update"
      }
    >
      {q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : (
        row && (
          <>
            {"bannerImage" in row && row.bannerImage ? (
              <Image
                source={{ uri: row.bannerImage }}
                style={{ width: "100%", height: 220, borderRadius: 7 }}
              />
            ) : "featuredImage" in row && row.featuredImage ? (
              <Image
                source={{ uri: row.featuredImage }}
                style={{ width: "100%", height: 220, borderRadius: 7 }}
              />
            ) : null}
            <Text style={styles.eyebrow}>SME CHAMBER OF INDIA</Text>
            <Text style={styles.title}>{row.title}</Text>
            <Text style={styles.text}>
              {"shortDescription" in row ? row.shortDescription : row.excerpt}
            </Text>
            {kind === "events" &&
              (() => {
                const e = row as ChamberEvent;
                return (
                  <>
                    <Card>
                      <Text style={styles.badge}>{e.eventType}</Text>
                      <Text style={styles.heading}>
                        {date(e.startDate)} ? {e.startTime} IST
                      </Text>
                      <Text style={styles.text}>
                        {e.venue}, {e.city}
                      </Text>
                      <Text style={styles.muted}>{e.address}</Text>
                      <Text style={styles.muted}>
                        Registration closes {date(e.registrationDeadline)}
                      </Text>
                      {!!e.googleMapsUrl && (
                        <Button
                          secondary
                          onPress={() => void Linking.openURL(e.googleMapsUrl)}
                        >
                          View location
                        </Button>
                      )}
                    </Card>
                    <Text style={styles.text}>{e.description}</Text>
                    {!!e.agenda && (
                      <Card>
                        <Text style={styles.heading}>Programme agenda</Text>
                        <Text style={styles.text}>{e.agenda}</Text>
                      </Card>
                    )}
                    {!!e.speakers?.length && (
                      <Card>
                        <Text style={styles.heading}>Speakers & experts</Text>
                        {e.speakers.map((s, i) => (
                          <View key={i}>
                            <Text style={styles.text}>{s.name}</Text>
                            <Text style={styles.muted}>{s.designation}</Text>
                          </View>
                        ))}
                      </Card>
                    )}
                    {e.gallery?.map((g, i) => (
                      <Image
                        key={i}
                        source={{ uri: g.url }}
                        style={{ height: 200, width: "100%", borderRadius: 6 }}
                      />
                    ))}
                    <Card>
                      <Text style={styles.heading}>
                        {e.paid
                          ? money(
                              totals(e.price, e.gstPercentage).totalAmount,
                            ) + " per attendee"
                          : "Complimentary registration"}
                      </Text>
                      <Text style={styles.muted}>
                        {e.paid ? "Including GST. " : ""}No login required to
                        register.
                      </Text>
                      <Button
                        disabled={new Date(e.registrationDeadline) < new Date()}
                        onPress={() =>
                          router.push({
                            pathname: "/events/booking/[id]",
                            params: { id: e.id, slug: e.slug },
                          })
                        }
                      >
                        Register for this event →
                      </Button>
                    </Card>
                    {!!e.terms && <Text style={styles.muted}>{e.terms}</Text>}
                  </>
                );
              })()}
            {kind === "membership" &&
              (() => {
                const p = row as Plan;
                const target = `/membership/checkout/${p.id}?slug=${p.slug}`;
                return (
                  <>
                    <Card>
                      <Text style={styles.title}>{money(p.price)}</Text>
                      <Text style={styles.muted}>
                        + {p.gstPercentage}% GST ? {p.durationMonths} months
                      </Text>
                      <Text style={styles.text}>{p.fullDescription}</Text>
                      {p.benefits.map((b) => (
                        <Text key={b} style={styles.text}>
                          ✓ {b}
                        </Text>
                      ))}
                    </Card>
                    <Card>
                      <Text style={styles.heading}>Eligibility & terms</Text>
                      <Text style={styles.text}>{p.eligibility}</Text>
                      <Text style={styles.muted}>{p.termsAndConditions}</Text>
                    </Card>
                    <Button
                      onPress={() =>
                        user
                          ? router.push(target)
                          : router.push({
                              pathname: "/auth/login",
                              params: { returnTo: target },
                            })
                      }
                    >
                      Buy membership ?{" "}
                      {money(totals(p.price, p.gstPercentage).totalAmount)}
                    </Button>
                  </>
                );
              })()}
            {kind === "news" && (
              <>
                <Text style={styles.muted}>
                  {date((row as News).publishedAt)} ? {(row as News).category}
                </Text>
                <Text style={styles.text}>{(row as News).content}</Text>
              </>
            )}
          </>
        )
      )}
    </Screen>
  );
}
