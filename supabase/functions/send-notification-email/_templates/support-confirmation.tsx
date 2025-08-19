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

interface SupportConfirmationEmailProps {
  firstName: string
  confirmDate: string
  songName: string
}

export const SupportConfirmationEmail = ({
  firstName,
  confirmDate,
  songName,
}: SupportConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>SoundCloud Groups // Support Confirmation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hey {firstName},</Text>
        
        <Text style={text}>
          Confirming the date {confirmDate} for support on this record: {songName}
        </Text>

        <div style={notice}>
          <Text style={noticeText}>
            **Please note that the support date is subject to change If you do not not submit 
            2-3 weeks before the release date, please expect the repost date to be scheduled 
            2-3 weeks from the day that you submitted. If you do not receive support within 
            5-7 business days of the confirmed date, please reach out to katt@artistinfluence.com**
          </Text>
        </div>

        <Text style={text}>
          No need to send a live link, unless requested. We will email you your receipt link 
          once we schedule support!
        </Text>

        <Text style={text}>Thank you,</Text>
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
  fontStyle: 'italic',
}

export default SupportConfirmationEmail