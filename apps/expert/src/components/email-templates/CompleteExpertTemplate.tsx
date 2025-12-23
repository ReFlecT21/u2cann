import * as React from "react";
import { CSSProperties } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface CompleteExpertTemplateProps {
  greeting: string;
  projectName: string;
}

export const CompleteExpertTemplate: React.FC<
  Readonly<CompleteExpertTemplateProps>
> = ({ greeting, projectName }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        {/* Header Section */}
        <Section style={header}>
          <Row>
            <Column style={logoContainer}>
              <Img
                width={160}
                src="https://asiadealhub.com/assets/images/New-WEBP-images/ADH-logo-_White-Text.webp"
                style={logoStyle} // Apply the logoStyle here
              />
            </Column>
          </Row>
          <Hr style={dividerStyle} />
          <Row style={navLinks}>
            <Link style={navItem} href="https://asiadealhub.com">
              Website
            </Link>
            <Link style={navItem} href="https://asiadealhub.com/terms">
              Terms & Conditions
            </Link>
            <Link
              style={navItem}
              href="https://asiadealhub.com/about-us-contact"
            >
              Contact
            </Link>
            <Link style={navItem} href="https://asiadealhub.com/vision-mission">
              About Us
            </Link>
          </Row>
        </Section>

        {/* Content Section */}
        <Section style={content}>
          <Text style={greetings}>{greeting}</Text>

          <Text style={paragraph}>
            Congratulations! You have successfully completed{" "}
            <strong>{projectName}</strong> on AsiaDealHub.
          </Text>

          <Text style={paragraph}>
            We appreciate your hard work and dedication to this project. Your
            contributions have been invaluable.
          </Text>

          <Text style={paragraph}>
            If you have any questions or need further assistance, feel free to
            reach out to us.
          </Text>

          <Text style={paragraph}>
            Thank you for being a valued member of AsiaDealHub. We look forward
            to working with you on future opportunities.
          </Text>
        </Section>

        {/* Footer Section */}
        <Section style={footer}>
          <Hr style={footerDivider} />
          <Text style={footerText}>
            IMPORTANT: The contents of this email and any attachments are
            confidential. They are intended for the named recipient(s) only. If
            you have received this email by mistake, please notify the sender
            immediately and do not disclose the contents to anyone or make
            copies thereof.
          </Text>
          <Text style={footerText}>
            Copyright © 2024 AsiaDealHub Pte Ltd. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Define styles using CSSProperties
const main: CSSProperties = {
  backgroundColor: "#f3f3f5",
  fontFamily: "Helvetica, Arial, sans-serif",
};

const container: CSSProperties = {
  width: "600px",
  maxWidth: "100%",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  padding: "20px",
};

const header: CSSProperties = {
  textAlign: "center",
  backgroundColor: "#0a0a0a",
  padding: "20px 0",
};

const logoContainer: CSSProperties = {
  textAlign: "center",
  paddingBottom: "10px",
};

const logoStyle: CSSProperties = {
  display: "block",
  margin: "0 auto",
};

const navLinks: CSSProperties = {
  textAlign: "center",
  padding: "10px 0",
};

const navItem: CSSProperties = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "14px",
  margin: "0 10px",
};

const content: CSSProperties = {
  padding: "20px",
};

const greetings: CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
};

const paragraph: CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#333",
};

const footer: CSSProperties = {
  textAlign: "center",
  padding: "20px 0",
  fontSize: "12px",
  color: "#999",
};

const footerDivider: CSSProperties = {
  margin: "20px 0",
};

const footerText: CSSProperties = {
  fontSize: "12px",
  color: "#999",
};

const dividerStyle: CSSProperties = {
  border: "0",
  height: "1px",
  background: "#e0e0e0",
  margin: "20px 0",
};
