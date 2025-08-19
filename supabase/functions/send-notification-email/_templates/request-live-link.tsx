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

interface RequestLiveLinkEmailProps {
  firstName: string
}

export const RequestLiveLinkEmail = ({
  firstName,
}: RequestLiveLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Please Send Your Live Link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hey {firstName},</Text>
        
        <Text style={text}>
          We couldn't find the live link on SoundCloud for your song we're supposed to support today. 
          Can you please reply to this email and include the live link so we can schedule support?
        </Text>

        <Text style={text}>Thank you!</Text>
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

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

export default RequestLiveLinkEmail