import { z } from 'zod';
import { commerceConfig } from '@/lib/config/site';

/**
 * The wire format for a cart.
 *
 * Note what is absent: prices. The client sends what it wants to buy, the server
 * decides what that costs.
 */

export const cartLineSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  shadeId: z.string().trim().max(64).optional(),
  quantity: z.coerce.number().int().min(1).max(commerceConfig.maxQuantityPerLine),
});

export const shippingMethodSchema = z.enum(['standard', 'express']);

export const cartPayloadSchema = z.object({
  items: z.array(cartLineSchema).min(1, { message: 'Your bag is empty.' }).max(50),
  couponCode: z.string().trim().max(24).optional(),
  shippingMethod: shippingMethodSchema.default('standard'),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(2).max(24),
  items: z.array(cartLineSchema).min(1).max(50),
  shippingMethod: shippingMethodSchema.default('standard'),
});

export type CartLine = z.output<typeof cartLineSchema>;
export type CartPayload = z.output<typeof cartPayloadSchema>;
export type CouponValidatePayload = z.output<typeof couponValidateSchema>;
