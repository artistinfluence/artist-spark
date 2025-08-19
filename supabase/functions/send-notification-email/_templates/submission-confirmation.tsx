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

interface SubmissionConfirmationEmailProps {
  firstName: string
  songName: string
  submissionUrl: string
  dateRequested: string
}

export const SubmissionConfirmationEmail = ({
  firstName,
  songName,
  submissionUrl,
  dateRequested,
}: SubmissionConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Submission received confirmation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Submission Received</Heading>
        <Text style={text}>Hi {firstName},</Text>
        <Text style={text}>We've received your submission! Here's a summary:</Text>
        
        <div style={summary}>
          <Text style={summaryItem}><strong>Song Name:</strong> {songName}</Text>
          <Text style={summaryItem}><strong>URL:</strong> {submissionUrl}</Text>
          <Text style={summaryItem}><strong>Date Requested:</strong> {dateRequested}</Text>
        </div>

        <Text style={text}>
          If you haven't received an approval or repost schedule within 5-7 business days 
          of the date you requested, please reach out to katt@artistinfluence.com
        </Text>

        <Text style={text}>Thank you for being part of this empowering community!</Text>

        <Text style={text}>Best,</Text>
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

const summary = {
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  padding: '20px',
  margin: '20px 0',
}

const summaryItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

export default SubmissionConfirmationEmail