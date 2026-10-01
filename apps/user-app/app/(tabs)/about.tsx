import { useState } from "react";
import { Image, ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Screen,
  PageHeader,
  styles,
  Card,
  Section,
} from "../../src/components/ui";

const chamberSections = {
  Objectives: [
    "Integration of entrepreneurs and start-ups",
    "Enhancing manufacturing activities in Tier 2 & 3 cities",
    "Initiatives for business growth & expansion/diversification",
    "Securing the interest of SMEs & manufacturers",
    "Strengthening enterprises for global competitiveness",
    "Innovation, invention and its commercialisation",
  ],
  Activities: [
    "Exploring business, exports & investment opportunities",
    "Business promotional events and activities",
    "Exchange of Business leads and referrals",
    "Networking activities for supply and procurement",
    "Educational and training programs for capacity building",
    "Generation of new entrepreneurship & start-ups",
    "Interactions with policy makers, financial institutions & corporates",
    "Awards & Recognitions for remarkable achievements",
    "Delegations to attend conferences, events & exhibitions",
    "Availing of Government incentives, benefits & grants",
    "Research, market survey and study",
    "Resolving issues & grievances related to business sectors",
  ],
  Services: [
    "Business advisory services for growth and expansion",
    "Sourcing, supply & procurement opportunities",
    "Setting up manufacturing units, identify industrial land",
    "Construction of smart factories and ready-made units",
    "Connectivity with buyers, importers, exporters and suppliers",
    "Marketing, branding and promotion",
    "Identifying potential investors and business partners",
    "Government services, liaison and corporate communications",
    "Revival of sick and struggling units",
  ],
  "Finance & Investment": [
    "Channelise bank finance & investment",
    "Identify investors and strategic investment partners",
    "PE, VC and ECBs",
    "Listing on the SME stock exchange",
    "Finance facility for participation in the Exhibitions",
    "Finance for setting up & buy out of manufacturing units",
  ],
  "International Business": [
    "Export promotion in emerging markets",
    "Joint ventures, technology transfers and collaborations",
    "Contract manufacturing and Mergers & acquisitions",
    "Business Advisory services for marketing & promotion",
    "Import facilitation & sourcing services",
    "Connectivity with buyers, importers and manufacturers",
    "Availing of advanced & patented technologies",
    "Acquisition of manufacturing units & businesses",
  ],
  "Specialised Services": [
    "Contract manufacturing through Global Manufacturing Capability Centres",
    "NPA settlements and restructuring of stressed SMEs",
    "Buyer-Seller meets with foreign enterprises",
    "Excellence in manufacturing for global competitiveness",
    "India SME Excellence Awards",
    "India Manufacturing Excellence Awards",
    "Women Entrepreneurs Excellence Awards",
    "SMEConnect magazines & publications",
    "Partnership opportunities in Make-In-India initiatives",
    "Market survey, research and study reports",
    "Government services and benefits of Government schemes & policies",
    "Exhibitions & trade fairs",
  ],
  Initiatives: [
    "SME Industrial Parks of India",
    "National SME Manufacturing Mission",
    "Manufacturers Business Forum",
    "SME Business Forum",
    "Suppliers Business Forum",
    "SME Legal Council",
    "Start-Ups Council of India",
    "SME Investment Promotion Council",
    "SME Exports Promotion Facilitation Centre",
    "SME Business Management Institute",
    "SME Technology Development Council",
    "SME Finance Facilitation Centre",
    "Women Entrepreneurs Development Council",
    "SMEtv & SME E-News | SMEConnect Magazine",
    "SMEtalks & SMECoach Platforms",
  ],
  "International Trade": [
    "India – Japan SME Business Council",
    "India – US SME Business Council",
    "India – China Business Council",
    "Europe – India SME Business Council",
    "India – GCC SME Business Council",
    "India – Africa SME Business Council",
    "India – South Korea SME Business Council",
    "India – Canada SME Business Council",
    "India – UK SME Business Council",
  ],
} as const;

type SectionName = keyof typeof chamberSections;

const sectionIcons: Record<SectionName, React.ComponentProps<typeof Ionicons>["name"]> = {
  Objectives: "compass-outline",
  Activities: "rocket-outline",
  Services: "briefcase-outline",
  "Finance & Investment": "cash-outline",
  "International Business": "globe-outline",
  "Specialised Services": "sparkles-outline",
  Initiatives: "layers-outline",
  "International Trade": "earth-outline",
};

function ChamberTabs() {
  const [active, setActive] = useState<SectionName>("Objectives");
  const items = chamberSections[active];
  return (
    <View style={{ gap: 14, marginTop: 6 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.eyebrow}>EXPLORE</Text>
        <Text style={styles.heading}>About the Chamber</Text>
        <Text style={styles.muted}>Our objectives, activities and business support ecosystem.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(Object.keys(chamberSections) as SectionName[]).map((name) => (
          <Pressable key={name} onPress={() => setActive(name)} style={{
            paddingHorizontal: 15, paddingVertical: 11, borderRadius: 14,
            backgroundColor: active === name ? "#008bc1" : "#eaf1f9",
          }}>
            <Text style={{ color: active === name ? "white" : "#263342", fontSize: 13, fontWeight: "700" }}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ gap: 10 }}>
        {items.map((item, index) => (
          <View key={item} style={[styles.card, { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }]}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "#dff3ff", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={index === 0 ? sectionIcons[active] : "checkmark-circle-outline"} color="#008bc1" size={19} />
            </View>
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700", color: "#263342" }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function About() {
  return (
    <Screen>
      <PageHeader
        title="About us"
        // subtitle="The people and purpose behind the Chamber"
        back 
        titleSize = {24}
      />

      {/* INTRODUCTION */}
      <View style={{ gap: 12, marginTop: -10 }}>
        <Text style={styles.eyebrow}>INTRODUCTION</Text>
        <Text style={styles.title}>Empowering SMEs for ‘Viksit Bharat’.</Text>
        <Text style={styles.text}>
          SME Chamber of India has been empowering the SME and manufacturing sector
          to continue their contributions for ‘Viksit Bharat’ for the last 33 years
          under the dynamic and indomitable leadership of Founder & President,
          Mr. Chandrakant Salunkhe.
        </Text>
      </View>

      {/* MISSION CARD */}
      <LinearGradient
        colors={["#008bc1", "#0087be"]}
        style={{ padding: 23, borderRadius: 22, gap: 16, marginVertical: 14 }}
      >
        <Ionicons name="compass-outline" color="white" size={24} />
        <Text
          style={{
            fontWeight: "700",
            fontSize: 21,
            color: "white",
            marginTop: 10,
          }}
        >
          Our Core Objective
        </Text>
        <Text style={{ fontSize: 16, color: "#c8e8f6", lineHeight: 23 }}>
          To enhance manufacturing activities in various parts of India, setting up
          new industrial units, land acquisition, re-development of existing units
          as a smart factory, and providing a networking platform to connect,
          communicate and commercialise each other’s business ideas.
        </Text>
      </LinearGradient>

      {/* FOUNDER'S MESSAGE */}
      <View style={{ marginTop: 10 }}>
        <Section title="Founder’s message" />
      </View>
      <Card>
        <View style={styles.row}>
          <Image
            source={require("../../assets/Chandrakant_Salunkhe.jpg")}
            style={{ width: 65, height: 65, borderRadius: 22, backgroundColor: "#dff3ff" }}
            accessibilityLabel="Mr. Chandrakant Salunkhe profile image"
          />
          <Ionicons
            name="chatbubble-ellipses-outline"
            color="#008bc1"
            size={25}
          />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 8 }}>
          Mr. Chandrakant Salunkhe
        </Text>
        <Text
          style={{
            color: "#008bc1",
            fontWeight: "700",
            fontSize: 13,
            marginTop: -2,
          }}
        >
          Founder & President
        </Text>
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
            color: "#263342",
            fontWeight: "600",
            marginTop: 8,
          }}
        >
          “Supporting enterprises to explore emerging business & investment opportunities,
          business growth, export promotion, supply & procurement, and channelizing
          finance & investment for further expansion and diversification.”
        </Text>
      </Card>

      {/* WHAT WE STAND FOR (Key Areas from content) */}
      <View style={{ marginTop: 10 }}>
        <Section title="Key focus areas" />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {(
          [
            ["Export promotion", "globe-outline"],
            ["Joint ventures", "git-network-outline"],
            ["Technology transfers", "hardware-chip-outline"],
            ["Mergers & acquisitions", "git-merge-outline"],
            ["Contract manufacturing", "construct-outline"],
            ["Sourcing & import", "boat-outline"],
          ] as const
        ).map(([label, icon]) => (
          <View
            key={label}
            style={[
              styles.card,
              { width: "48%", flexGrow: 1, padding: 16, gap: 20 },
            ]}
          >
            <Ionicons name={icon} color="#008bc1" size={22} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#263342" }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* SERVICES & EXPANSION */}
      <View style={{ marginTop: 18 }}>
        <Section title="Business support & growth" />
      </View>
      <View style={{ paddingLeft: 12 }}>
        {[
          [
            "Smart Factories",
            "Re-development of existing industrial units into smart manufacturing setups.",
          ],
          [
            "Finance & Investment",
            "Channelizing investments and providing strong networking platforms.",
          ],
          [
            "Marketing & Branding",
            "Comprehensive support for promotion, franchise, and distribution.",
          ],
        ].map(([title, desc], i) => (
          <View
            key={title}
            style={{
              borderLeftWidth: i === 2 ? 0 : 1,
              borderColor: "#b5d9e6",
              paddingLeft: 23,
              paddingBottom: 18,
              gap: 5,
            }}
          >
            <View
              style={{
                position: "absolute",
                left: -5,
                top: 0,
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: "#008bc1",
                borderWidth: 2,
                borderColor: "#d8f1fb",
              }}
            />
            <Text style={{ color: "#008bc1", fontSize: 15, fontWeight: "700" }}>
              {title}
            </Text>
            <Text style={styles.muted}>{desc}</Text>
          </View>
        ))}
      </View>

      {/* OUR IMPACT (Untouched as requested) */}
      <Card>
        <Text style={styles.eyebrow}>OUR IMPACT</Text>
        <View style={[styles.row, { paddingTop: 12 }]}>
          {[
            ["33", "Years of service"],
            ["2,500+", "Members"],
            ["180+", "Events"],
          ].map(([n, label]) => (
            <View key={label} style={{ gap: 5 }}>
              <Text
                style={{ color: "#08749e", fontSize: 25, fontWeight: "700" }}
              >
                {n}
              </Text>
              <Text style={{ fontSize: 11, color: "#748193" }}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
