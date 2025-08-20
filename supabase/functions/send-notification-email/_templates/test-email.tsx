import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TestEmailProps {
  firstName?: string
}

export const TestEmail = ({
  firstName = 'Test User',
}: TestEmailProps) => (
  <Html>
    <Head />
    <Preview>Test Email from SoundCloud Groups</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Test Email</Heading>
        <Text style={text}>Hey {firstName},</Text>
        
        <Text style={text}>
          This is a test email from the SoundCloud Groups automation system. 
          If you're receiving this, it means the email system is working correctly!
        </Text>

        <Text style={text}>
          Sent at: {new Date().toISOString()}
        </Text>

        <Text style={text}>Best regards,</Text>
        <Text style={text}>The SoundCloud Groups Team</Text>
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

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

export default TestEmail