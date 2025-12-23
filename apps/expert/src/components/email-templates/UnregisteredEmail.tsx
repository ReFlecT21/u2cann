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

interface UnregisteredEmailProps {
  message: string;
  projectName: string;
  projectLink: string;
}

export const UnregisteredEmail: React.FC<Readonly<UnregisteredEmailProps>> = ({
  message,
  projectName,
  projectLink,
}) => (
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

        <Section style={content}>
          {message.split("\n").map((line, index) => (
            <Text key={index} style={paragraph}>
              {line}
            </Text>
          ))}
        </Section>

        {/* Call to Action */}
        <Section style={ctaContainer}>
          <Button style={ctaButton} href={projectLink}>
            View Project Details
          </Button>
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

const ctaContainer: CSSProperties = {
  textAlign: "center",
  marginTop: "20px",
};

const ctaButton: CSSProperties = {
  backgroundColor: "#ff6600",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "5px",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
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
