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

interface WelcomeAdmissionEmailProps {
  firstName: string
  submissionFormUrl: string
}

export const WelcomeAdmissionEmail = ({
  firstName,
  submissionFormUrl,
}: WelcomeAdmissionEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Our SoundCloud Groups 👏</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Our SoundCloud Groups 👏</Heading>
        
        <Text style={text}>Hey {firstName},</Text>
        
        <Text style={text}>
          We appreciate you reaching out to become a member of the world's largest SoundCloud groups. 
          We're pleased to let you know we've accepted your application. Please connect your account 
          to our network with the URL below - then let us know once this step is completed.
        </Text>

        <div style={buttonContainer}>
          <Link
            href="https://influenceplanner.com/invite/artistinfluence"
            style={button}
          >
            Join Here
          </Link>
        </div>

        <Text style={text}>
          Katt, our SoundCloud operator, will confirm your account is connected to our network. 
          You can see how many reposts you have per month through your dashboard.
        </Text>

        {submissionFormUrl && (
          <Text style={text}>
            Here is the <Link href={submissionFormUrl} style={link}>submission form</Link>
          </Text>
        )}

        <Text style={text}>Excited to have you as a part of our community :)</Text>

        <Text style={text}>Looking Forward,</Text>
        <Text style={text}>The Artist Influence Team</Text>
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
  margin: '40px 0',
  padding: '0',
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
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
}

export default WelcomeAdmissionEmail