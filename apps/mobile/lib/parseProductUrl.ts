/**
 * GOAL-03 URL parse — client wrapper around the parse-product-url Edge
 * Function. Maps transport errors to the spec's two distinct failure copies
 * (Spec §5.1 / §8.6): network down → 'offline' ("No connection. Enter details
 * manually."), anything else unparseable → 'failed' ("We couldn't read this
 * link. Fill in the details manually.").
 */

import { FunctionsFetchError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type ParseStatus = 'full' | 'partial' | 'failed' | 'offline'

export interface ParsedProduct {
  status: ParseStatus
  name: string | null
  imageUrl: string | null
  /** Rupees. Null on partial parse — GOAL-04 leaves the price field blank. */
  price: number | null
}

interface FunctionResponse {
  status: 'full' | 'partial' | 'failed'
  name?: string | null
  image_url?: string | null
  price?: number | null
}

export async function parseProductUrl(url: string): Promise<ParsedProduct> {
  try {
    const { data, error } = await supabase.functions.invoke<FunctionResponse>(
      'parse-product-url',
      { body: { url } },
    )
    if (error || !data) {
      return error instanceof FunctionsFetchError
        ? { status: 'offline', name: null, imageUrl: null, price: null }
        : { status: 'failed', name: null, imageUrl: null, price: null }
    }
    return {
      status: data.status,
      name: data.name ?? null,
      imageUrl: data.image_url ?? null,
      price: data.price ?? null,
    }
  } catch {
    return { status: 'failed', name: null, imageUrl: null, price: null }
  }
}
