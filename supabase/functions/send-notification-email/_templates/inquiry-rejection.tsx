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

interface InquiryRejectionEmailProps {
  firstName: string
}

export const InquiryRejectionEmail = ({
  firstName,
}: InquiryRejectionEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Inquiry Status // Artist Influence SoundCloud Groups</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hey {firstName},</Text>
        
        <Text style={text}>
          Thank you for your interest in joining Artist Influence's SoundCloud repost groups! 
          We've reviewed your application and, unfortunately, we're unable to include you in 
          our groups at this time due to us prioritizing accounts with a larger existing following. 
          We do this to ensure a balanced exchange within the network, and this decision does not 
          reflect the quality of your work.
        </Text>

        <Text style={text}>
          That said, we'd still love to support your music! We offer a paid repost option that 
          gives your track exposure across our network without the need for membership requirements. 
          You can view pricing for reposts, as well as other campaign options here:
        </Text>

        <div style={buttonContainer}>
          <Link
            href="https://pricing.artistinfluence.com/"
            style={button}
          >
            View Pricing Options
          </Link>
        </div>

        <Text style={text}>
          If that's something you're interested in, feel free to reach out with katt@artistinfluence.com 
          on CC and we'll send over the next steps!
        </Text>

        <Text style={text}>Looking forward to hearing more from you.</Text>

        <Text style={text}>Best,</Text>
        <Text style={text}>The Artist Influence Team 🌟</Text>

        <div style={footer}>
          <Text style={footerText}>
            Please contact katt@artistinfluence.com or jared@artistinfluence.com with all questions, 
            appeals, and paid marketing campaigns
          </Text>
          <Text style={footerText}>Warm Regards,</Text>
          <Text style={footerText}>The Artist Influence Team</Text>
        </div>
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

const footer = {
  borderTop: '1px solid #eaeaea',
  marginTop: '32px',
  paddingTop: '16px',
}

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

export default InquiryRejectionEmail