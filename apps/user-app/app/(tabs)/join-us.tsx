import { useState } from "react";
import { Text, View } from "react-native";
import { enquirySchema } from "@sme/shared";
import { Form } from "../../src/components/Form";
import { Screen, PageHeader, styles, Button } from "../../src/components/ui";
import { mutate } from "../../src/lib/api";
export default function Join() {
  const [sent, setSent] = useState(false);
  return (
    <Screen>
      <PageHeader
        title="Join us"
        subtitle="Become part of the SME community"
        back
      />
      <Text style={[styles.title, { marginTop: -12 }]}>
        Bring your ambition to a trusted room.
      </Text>
      <Text
        style={[
          styles.muted,
          { fontSize: 16, lineHeight: 25, marginBottom: 14 },
        ]}
      >
        Tell us a little about yourself and we’ll help you find the right way to
        participate.
      </Text>
      {sent ? (
        <View style={{ gap: 17 }}>
          <Text style={styles.heading}>Thank you for reaching out.</Text>
          <Text style={styles.text}>
            Your enquiry has been received. Our team will get in touch.
          </Text>
          <Button secondary onPress={() => setSent(false)}>
            Send another enquiry
          </Button>
        </View>
      ) : (
        <Form
          schema={enquirySchema}
          defaults={{
            firstName: "",
            lastName: "",
            email: "",
            mobile: "",
            company: "",
            designation: "",
            city: "Mumbai",
            state: "",
            subject: "Join the SME community",
            message: "",
          }}
          fields={[
            {
              name: "firstName",
              label: "First name *",
              placeholder: "Your first name",
            },
            {
              name: "lastName",
              label: "Last name *",
              placeholder: "Your last name",
            },
            {
              name: "company",
              label: "Company name",
              placeholder: "Company or organisation",
            },
            {
              name: "designation",
              label: "Designation",
              placeholder: "Your role",
            },
            {
              name: "email",
              label: "Email *",
              keyboard: "email-address",
              placeholder: "you@company.com",
            },
            {
              name: "mobile",
              label: "Mobile number *",
              keyboard: "phone-pad",
              placeholder: "10-digit mobile number",
            },
            { name: "city", label: "City", placeholder: "Mumbai" },
            {
              name: "message",
              label: "Message",
              multiline: true,
              placeholder: "Anything you would like us to know?",
            },
          ]}
          submit="Submit"
          onSubmit={async (data) => {
            await mutate("/enquiries", "POST", data);
            setSent(true);
          }}
        />
      )}
    </Screen>
  );
}
