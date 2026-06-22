import { supabase } from '../lib/supabase'
import { CACAO_ECONOMY } from '../utils/constants'

export type RedeemItemType =
  | 'adoption'
  | 'product_5usd'
  | 'product_1usd'
  | 'product_custom'

export interface RedeemResult {
  ok: boolean
  beans_spent?: number
  new_balance?: number
  usd_value?: number
  error?: string
  have?: number
  need?: number
}

export function useRedeemTokens() {
  const redeem = async (
    item_type: RedeemItemType,
    opts: { beans_to_spend?: number; item_ref?: string } = {},
  ): Promise<RedeemResult> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: 'not_authenticated' }

    const body: Record<string, unknown> = { item_type }
    if (opts.item_ref)        body.item_ref        = opts.item_ref
    if (opts.beans_to_spend)  body.beans_to_spend  = opts.beans_to_spend

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-tokens`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      },
    )

    return res.json()
  }

  /** Can the user afford an adoption with their current bean balance? */
  const canAffordAdoption = (beans: number) => beans >= CACAO_ECONOMY.ADOPTION_BEANS

  /** USD saved by spending the given bean amount */
  const beansToUsd = (beans: number) => beans / CACAO_ECONOMY.BEANS_PER_USD

  /** Beans needed to cover a given product price in USD cents (e.g. 600 → 60 beans) */
  const productBeansPrice = (priceUsdCents: number) =>
    Math.ceil((priceUsdCents / 100) * CACAO_ECONOMY.BEANS_PER_USD)

  return { redeem, canAffordAdoption, beansToUsd, productBeansPrice }
}
