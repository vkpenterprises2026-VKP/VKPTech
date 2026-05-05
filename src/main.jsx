import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeIndianRupee,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Headphones,
  Laptop,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCog,
  X
} from "lucide-react";
import { login, logout, signup, watchUser } from "./firebaseClient.js";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";

const products = [
  {
    id: "srv-dell-t150",
    category: "Servers",
    name: "Dell PowerEdge Tower Server",
    sku: "VKP-SRV-001",
    price: 74999,
    dealerPrice: 70499,
    stock: 7,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "lap-business-i5",
    category: "Laptops & Desktops",
    name: "Business Laptop Intel i5",
    sku: "VKP-LAP-014",
    price: 42999,
    dealerPrice: 39999,
    stock: 19,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "desk-office-i3",
    category: "Laptops & Desktops",
    name: "Office Desktop Combo",
    sku: "VKP-DESK-022",
    price: 24999,
    dealerPrice: 22999,
    stock: 23,
    image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "net-poe-switch",
    category: "Networking",
    name: "24 Port PoE Network Switch",
    sku: "VKP-NET-031",
    price: 18999,
    dealerPrice: 17499,
    stock: 11,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "cctv-8ch-kit",
    category: "CCTV & Security",
    name: "8 Channel CCTV Installation Kit",
    sku: "VKP-CCTV-044",
    price: 21999,
    dealerPrice: 19999,
    stock: 15,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "fw-smb-utm",
    category: "Firewalls",
    name: "SMB UTM Firewall Appliance",
    sku: "VKP-FW-009",
    price: 32999,
    dealerPrice: 30499,
    stock: 5,
    image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "printer-laser",
    category: "Printers",
    name: "Office Laser Printer",
    sku: "VKP-PRN-018",
    price: 14999,
    dealerPrice: 13799,
    stock: 12,
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "acc-ups-1kva",
