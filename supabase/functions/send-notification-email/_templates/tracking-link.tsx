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

interface TrackingLinkEmailProps {
  firstName: string
  memberName: string
  trackingLink: string
}

export const TrackingLinkEmail = ({
  firstName,
  memberName,
  trackingLink,
}: TrackingLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Support Link // {memberName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hey {firstName},</Text>
        
        <Text style={text}>
          Here is your link to check your support:
        </Text>

        <div style={linkContainer}>
          <Link href={trackingLink} style={trackingButton}>
            View Your Support Status
          </Link>
        </div>
        
        <div style={linkText}>
          <Text style={smallText}>
            Or copy and paste: {trackingLink}
          </Text>
        </div>

        <Text style={text}>
          Best of luck on your release, and thank you for being part of this empowering community!
        </Text>

        <Text style={text}>-The Artist Influence Team</Text>
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

const linkContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const trackingButton = {
  backgroundColor: '#28a745',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const linkText = {
  textAlign: 'center' as const,
  margin: '16px 0',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

export default TrackingLinkEmail