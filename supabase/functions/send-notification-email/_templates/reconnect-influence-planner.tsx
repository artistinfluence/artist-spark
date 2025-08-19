import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ReconnectInfluencePlannerEmailProps {
  firstName: string
  accountName: string
}

export const ReconnectInfluencePlannerEmail = ({
  firstName,
  accountName,
}: ReconnectInfluencePlannerEmailProps) => (
  <Html>
    <Head />
    <Preview>[Artist Influence] ‼️ Reconnect to stay in our SoundCloud repost network 🔁</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hi {firstName},</Text>
        
        <Text style={text}>
          It looks like {accountName} was disconnected from Influence Planner! No worries — you can 
          easily reconnect to our SoundCloud repost network using this one-click link:
        </Text>

        <div style={buttonContainer}>
          <Link
            href="https://influenceplanner.com/invite/artistinfluence"
            style={button}
          >
            👉 Reconnect Now
          </Link>
        </div>

        <div style={linksSection}>
          <Text style={text}>Find group info, guidelines, and FAQs below:</Text>
          <Link href="https://www.artistinfluence.com/groups" style={link}>
            🌐 https://www.artistinfluence.com/groups
          </Link>
        </div>

        <Text style={text}>
          If you have any questions, reply to this email or reach out to us at 
          katt@artistinfluence.com - we're here to help!
        </Text>

        <Text style={text}>Looking forward to continuing our work together.</Text>

        <Text style={text}>— Katt @ The Artist Influence Team 🌟</Text>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#ff6b6b',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const linksSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
  fontSize: '14px',
}

export default ReconnectInfluencePlannerEmail