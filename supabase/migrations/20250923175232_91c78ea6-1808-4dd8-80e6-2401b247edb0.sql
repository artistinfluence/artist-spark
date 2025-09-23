-- First, let's create repost credit wallets for all existing members who don't have one
INSERT INTO repost_credit_wallet (member_id, balance, monthly_grant, cap)
SELECT 
  m.id as member_id,
  m.computed_monthly_repost_limit as balance,
  m.computed_monthly_repost_limit as monthly_grant, 
  m.computed_monthly_repost_limit as cap
FROM members m
WHERE NOT EXISTS (
  SELECT 1 FROM repost_credit_wallet w WHERE w.member_id = m.id
)
AND m.computed_monthly_repost_limit IS NOT NULL;

-- Update existing wallets to match member computed limits
UPDATE repost_credit_wallet 
SET 
  monthly_grant = m.computed_monthly_repost_limit,
  cap = m.computed_monthly_repost_limit,
  balance = GREATEST(balance, 1) -- Ensure at least 1 credit for testing
FROM members m 
WHERE repost_credit_wallet.member_id = m.id 
AND m.computed_monthly_repost_limit IS NOT NULL;