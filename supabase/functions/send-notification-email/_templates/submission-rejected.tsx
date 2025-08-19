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

interface SubmissionRejectedEmailProps {
  firstName: string
}

export const SubmissionRejectedEmail = ({
  firstName,
}: SubmissionRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Submission: Not Approved</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hi {firstName},</Text>
        
        <Text style={text}>
          Thanks for sending in your track! I wanted to let you know we weren't able to approve 
          your submission at this time, as you've already used your submission allowance for this month.
        </Text>

        <div style={notice}>
          <Text style={noticeText}>
            **If you're not yet part of our repost exchange network, that could also be a reason for rejection.** 
            If that's the case, feel free to reach out to katt@artistinfluence.com to get connected—we'd 
            love to have you onboard!
          </Text>
        </div>

        <Text style={text}>
          Just a quick reminder: our repost network regulates submissions per month to keep things fair 
          and organized for everyone. You're more than welcome to submit again next month, and we're 
          excited to hear what you share!
        </Text>

        <Text style={text}>
          Thanks for being part of the community—let me know if you have any questions.
        </Text>

        <Text style={text}>Best,</Text>
        <Text style={text}>Katt</Text>
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

const notice = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '5px',
  padding: '16px',
  margin: '20px 0',
}

const noticeText = {
  color: '#856404',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  fontWeight: 'bold',
}

export default SubmissionRejectedEmail