import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageSourcePropType, Pressable, Text, View } from "react-native";
import { Card, PageHeader, Screen, styles } from "../src/components/ui";

type Person = { name: string; image: ImageSourcePropType | string; roles: string[] };

const national: Person[] = [
  { name: "Mr. Chandrakant Salunkhe", image: require("../assets/Chandrakant_Salunkhe.jpg"), roles: ["Chairman of National Advisory Board", "Founder & President - SME Chamber of India", "Hon. President - Manufacturers & Exporters Association of India", "Chairman & Managing Director - Macro Group of Companies"] },
  { name: "Mr. Varadhan T. R.", image:require("../assets/Varadhan.jpg"), roles: ["Chairman, Mascot Systems Pvt. Ltd.", "Vice-President of the Chamber"] },
  { name: "Mr. Pratapsingh Nathani", image: require("../assets/Pratapsingh_Nathani.jpg"), roles: ["Founder, Beacon Trusteeship Ltd. and Vermillion Finalytics Pvt. Ltd.", "Vice-President of the Chamber"] },
  { name: "Mr. Mahmood Khan", image: require("../assets/Mahmood_Khan.jpg"), roles: ["Vice President - Banking & Government Agencies, SME Chamber of India", "Managing Director, Gold Rush Capital Services Pvt. Ltd."] },
  { name: "Mr. Jhumarmal Tunwal", image: require("../assets/Jhumarmal_Tunwal.jpg"), roles: ["Vice President, SME Chamber of India", "Chairman & MD, Tunwal E-Motors Limited"] },
  { name: "Dr. Rajendra Jagdale", image: require("../assets/Rajendra_Jagdale.jpg"), roles: ["Director General and CEO, Science and Technology Park"] },
  { name: "Dr. Sunil J. Pathare", image: require("../assets/Sunil_Pathare.jpeg"), roles: ["Chairman & Managing Director, VIP Clothing Ltd."] },
  { name: "Mr. Prabhakar Dalal", image: require("../assets/Parbhakar_Dalal.jpeg"), roles: ["Former Executive Director - Export-Import Bank of India", "Independent Director - Poonawalla Fincorp Limited"] },
  { name: "Mr. Prashant Nagre", image: require("../assets/Prashant_Nagre.jpg"), roles: ["Managing Director, Fermenta Biotech Ltd."] },
  { name: "Dr. R. Seetharaman", image: require("../assets/Dr_R_Seetharaman.jpg"), roles: ["Principal Advisor, India - GCC SME Business Council", "Former Chief Executive Officer of Doha Bank"] },
  { name: "Mr. Virendra Jhamb", image: require("../assets/Virendra_Jhamb.jpg"), roles: ["Founder & MD, Clean Earth Energy Solution India Pvt. Ltd."] },
  { name: "Dr. Mukund Purohit", image: require("../assets/Mukund_Purohit.jpg"), roles: ["Director - Gujarat State, SME Chamber of India", "Founder & Managing Director, Neapolitan Pizza & Foods Ltd. and Ashra IT Services Pvt. Ltd."] },
  { name: "Mr. Nihar B. Thackeray", image: require("../assets/Thackeray.jpg"), roles: ["Honorary Chairman of SME Legal Council for Maharashtra State", "Managing Partner - Vis Legis Law Practice, Advocates"] },
  { name: "Mr. Kishor Kharat", image: require("../assets/Kishor_Kharat.jpg"), roles: ["Former MD & CEO, Indian Bank and IDBI Bank", "Chairman, SME Banking and Finance Council"] },
  { name: "Mr. Alessandro Giuliani", image: require("../assets/Alessandro_Giuliani.jpg"), roles: ["Managing Director, SDA Bocconi Asia Centre (India and Italy)"] },
  { name: "Mr. Krishan Kumar Gupta", image: require("../assets/KK_GUPTA.jpg"), roles: ["Director - Resurgent India Ltd.", "Vice-Chairman of Banking & Financial Task Force"] },
  { name: "Prof. Seema Saini", image: require("../assets/Seema_Saini.jpg"), roles: ["CEO, N. L. Dalmia Educational Society"] },
  { name: "Dr. Subramanya Kusnur", image: require("../assets/Kusnur.jpg"), roles: ["Chairman & CEO, AquaKraft Group Ventures"] },
  { name: "Mr. Samir Sathe", image: require("../assets/Samir_Sathe.jpg"), roles: ["Founder & CEO, SAM'SPACE"] },
  { name: "Mr. Ajit Shah", image: require("../assets/Ajit_Shah.jpg"), roles: ["CEO, Universal Connections (Consultancy on International Trade & Training)"] },
  { name: "Mr. Markus Pfefferer", image: require("../assets/Markus_Pfefferer.jpg"), roles: ["Managing Partner, COMANO Advisory LLP, Bangalore, India"] },
  { name: "Mr. Rajesh Bhagat", image: require("../assets/Rajesh_Bhagat.jpg"), roles: ["Managing Director, Worldex India Exhibition & Promotion Pvt. Ltd."] },
  { name: "Mr. Ravindra Kumar", image: require("../assets/Ravindra_Kumar.jpg"), roles: ["Former Director, Standard Bank (South Africa) &Consultant, Finance & Investment"] },
  { name: "Ms. Manjusha Bhave", image: require("../assets/Bhave.jpg"), roles: ["Chairperson & MD, GIIAVA Group of Companies, India & Singapore"] },
  { name: "Ms. Vasundhara Chowdhary", image: require("../assets/Vasundhara.jpg"), roles: ["Director (Global Partnerships & Government Affairs), SME Chamber of India", "CEO & Founder - VC Global Solutions"] },
  { name: "Mrs. Neelambari Shelar", image: require("../assets/Neelambari.jpg"), roles: ["Director - Goa State, WEDC", "Founder, Mark International"] },
];

const international: Person[] = [
  { name: "Mr. Chandrakant Salunkhe", image: require("../assets/Chandrakant_Salunkhe.jpg"), roles: ["Chairman of International Advisory Board", "Founder & President - SME Chamber of India", "Chairman & Managing Director - Macro Group of Companies"] },
  { name: "Dr. R. Seetharaman",image: require("../assets/Dr_R_Seetharaman.jpg"), roles: ["Principal Advisor, India - GCC SME Business Council", "Former Chief Executive Officer of Doha Bank"] },
  { name: "Mr. Ajay Jha", image: require("../assets/Ajay_Jha.jpg"), roles: ["CEO, INNOP Global Incubator / Accelerator, Denver, Colorado, USA"] },
  { name: "Mr. Rakhmad Sobirov", image: require("../assets/Rakhmad.jpg"), roles: ["Managing Director, Sobirovs Law Firm, Toronto, Canada", "Director - India-Canada SME Business Council (Canada Region)"] },
  { name: "Mr. Radion Popov", image: require("../assets/Radion_Popov.jpg"), roles: ["Director, Europe - India SME Business Council", "Former State Minister for Foreign Affairs, Bulgaria"] },
  { name: "Mr. Vikash Sahadeo Ramjit", image: require("../assets/Vikash.jpg"), roles: ["Director - Business Development, Trustmore (Mauritius) Ltd", "Chairman - Mauritius & Africa Region, SME Chamber of India"] },
  { name: "Mr. Sailesh Nathan", image: require("../assets/Sailesh.jpg"), roles: ["Chairman & MD, Buy-Do-Buy Advertising LLC, Dubai", "Regional Director, SME Chamber of India (GCC Countries)"] },
  { name: "Datuk Abdul Malik Abdullah", image: require("../assets/Abdul.jpg"), roles: ["Group Chairman, D'Tandoor International Group of Companies, Malaysia"] },
];

const management: Person[] = [
  { name: "Mr. S. Maheshkumar", image: require("../assets/mahesh.jpg"), roles: ["Director & General Secretary, SME Chamber of India"] },
  { name: "Ms. Saakshi Kulkarni", image: require("../assets/Saakshi.png"), roles: ["Director, SME Chamber of India"] },
  { name: "Ms. Smita Bholane", image: require("../assets/Smita.jpg"), roles: ["Director, Pune Region, SME Chamber of India"] },
  { name: "Ms. Madhuri Khanwalkar", image: require("../assets/madhuri.png"), roles: ["Deputy Secretary General, SME Chamber of India"] },
  { name: "Mr. Kedar Kulkarni", image: require("../assets/kedar.jpg"), roles: ["Deputy CEO, SME Chamber of India"] },
  { name: "Ms. Geeta Raza", image: require("../assets/shabnam.jpg"), roles: ["Senior General Manager, SME Chamber of India"] },
];

function PersonCard({ person, featured }: { person: Person; featured?: boolean }) {
  return (
    <Card>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <Image
          source={typeof person.image === "string" ? { uri: person.image } : person.image}
          style={{ 
            width: 52, 
            height: 62, 
            borderRadius: 17, 
            backgroundColor: featured ? "#008bc1" : "#dff3ff" 
          }}
          accessibilityLabel={`${person.name} profile image`}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: "700", color: "#111827" }}>
            {person.name}
          </Text>
          {person.roles.map((role) => (
            <Text 
              key={role} 
              style={{ fontSize: 12, lineHeight: 19, color: "#748193", fontWeight: "500" }}
            >
              {role}
            </Text>
          ))}
        </View>
      </View>
    </Card>
  );
}

export default function Boards() {
  const [active, setActive] = useState<"national" | "international" | "management">("national");
  const people = active === "national" ? national : active === "international" ? international : management;
  const label = active === "national" ? "National Advisory Board" : active === "international" ? "International Advisory Board" : "Management Team";
  return (
    <Screen>
      <PageHeader title="Boards" 
      // subtitle="The people guiding SME growth" 
      back titleSize={27} />
      
      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        {([ ["national", "National"], ["international", "International"], ["management", "Management"] ] as const).map(([key, title]) => (
          <Pressable key={key} onPress={() => setActive(key)} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 7, borderRadius: 14, backgroundColor: active === key ? "#008bc1" : "#eaf1f9", alignItems: "center" }}>
            <Text style={{ color: active === key ? "white" : "#263342", fontSize: 12, fontWeight: "700" }}>{title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 9, alignItems: "center", marginTop: 4 }}>
        <Ionicons name="people-outline" size={20} color="#008bc1" />
        <Text style={styles.heading}>{label}</Text>
      </View>
      <View style={{ gap: 12 }}>
        {people.map((person, index) => <PersonCard key={`${active}-${person.name}-${index}`} person={person} featured={index === 0} />)}
      </View>
      
    </Screen>
  );
}
