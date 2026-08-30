"use client";

import { Store, ShoppingCart, Car, Shirt } from "lucide-react";
import { shopTypeInfo } from "@/lib/shopTypes";

const SHOP_TYPE_ICONS = { Store, ShoppingCart, Car, Shirt };

export default function ShopTypeIcon({ type, size = 16 }) {
  const Icon = SHOP_TYPE_ICONS[shopTypeInfo(type).icon] || Store;
  return <Icon size={size} />;
}
