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
    category: "Accessories",
    name: "1KVA UPS Backup System",
    sku: "VKP-ACC-067",
    price: 6999,
    dealerPrice: 6299,
    stock: 28,
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80"
  }
];

const services = [
  ["IT Infrastructure", "Server, endpoint, firewall, backup, and network setup for growing offices."],
  ["Laptop & Desktop Service", "Chip-level diagnosis, OS setup, SSD upgrades, AMC, and fast repair support."],
  ["CCTV & Security", "Camera selection, installation, storage planning, remote viewing, and maintenance."],
  ["Website & SEO", "Fast business websites, lead forms, local SEO, analytics, and conversion tracking."],
  ["Networking", "Switches, routers, WiFi, PoE planning, rack dressing, and structured cabling."],
  ["ERP & Automation", "Billing, stock, CRM, WhatsApp alerts, n8n workflows, and dealer portals."]
];

const blogPosts = [
  ["How to choose CCTV cameras for shops in Coimbatore", "Security planning checklist for retail, office, and warehouse owners."],
  ["Laptop repair vs replacement: what businesses should check", "A practical guide for reducing downtime and unnecessary spend."],
  ["Why every office network needs a firewall", "Simple security controls that protect accounts, data, and billing systems."]
];

function currency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [role, setRole] = useState("customer");
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leadStatus, setLeadStatus] = useState("");

  React.useEffect(() => watchUser((user, userProfile) => {
    setAuthUser(user);
    setProfile(userProfile);
    if (userProfile?.role === "dealer" && userProfile?.approved) setRole("dealer");
  }), []);

  const categories = useMemo(() => ["All", ...new Set(products.map((product) => product.category))], []);
  const visibleProducts = activeCategory === "All" ? products : products.filter((product) => product.category === activeCategory);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...items, { ...product, price: role === "dealer" ? product.dealerPrice : product.price, qty: 1 }];
    });
  }

  async function submitLead(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setLeadStatus("Saving enquiry...");
    try {
      await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setLeadStatus("Enquiry saved. VKP will contact you shortly.");
      event.currentTarget.reset();
    } catch {
      setLeadStatus("Enquiry captured locally. Please WhatsApp us for fastest response.");
    }
  }

  async function checkout(product) {
    const items = product ? [{ ...product, qty: 1 }] : cart;
    const customer = {
      name: document.querySelector("[name='name']")?.value || "VKP Customer",
      phone: document.querySelector("[name='phone']")?.value || "",
      email: document.querySelector("[name='email']")?.value || ""
    };

    const response = await fetch(`${API_BASE}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, customer })
    });
    const order = await response.json();
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: "INR",
      name: "VKP Technologies",
      description: "IT hardware and services",
      order_id: order.orderId,
      prefill: customer,
      handler: async (payment) => {
        const verify = await fetch(`${API_BASE}/api/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payment, orderRecordId: order.orderRecordId })
        });
        const result = await verify.json();
        if (result.invoiceUrl) window.location.href = `${API_BASE}${result.invoiceUrl}`;
      },
      modal: {
        ondismiss: () => fetch(`${API_BASE}/api/payments/failure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderRecordId: order.orderRecordId, reason: "Checkout closed" })
        })
      }
    };
    new window.Razorpay(options).open();
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top"><span>VKP</span> Technologies</a>
        <button className="icon-button menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <button className="icon-button close-toggle" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={22} /></button>
          <a href="#services">Services</a>
          <a href="#catalogue">Catalogue</a>
          <a href="#offers">Offers</a>
          <a href="#admin">ERP</a>
          <a href="#blog">Blog</a>
          <a className="nav-cta" href="#bulk">Bulk Enquiry</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Coimbatore IT services + business hardware</span>
            <h1>Buy, service, secure, and automate your office IT from one platform.</h1>
            <p>VKP Technologies supplies servers, laptops, CCTV, firewalls, networking, printers, websites, SEO, billing automation, and dealer-ready bulk ordering.</p>
            <div className="hero-actions">
              <a className="primary-btn" href="#catalogue">Shop Products <ChevronRight size={18} /></a>
              <a className="secondary-btn" href={whatsappUrl("Hi VKP Technologies, I need a quotation.")}>WhatsApp Quote <MessageCircle size={18} /></a>
            </div>
            <div className="trust-row">
              <span><CheckCircle2 size={17} /> GST invoice</span>
              <span><Truck size={17} /> India delivery</span>
              <span><ShieldCheck size={17} /> Verified payment</span>
            </div>
          </div>
          <div className="hero-media">
            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" alt="VKP Technologies IT service desk" />
          </div>
        </section>

        <section className="stats-band">
          <div><strong>500+</strong><span>Devices serviced</span></div>
          <div><strong>24h</strong><span>Quote response</span></div>
          <div><strong>18%</strong><span>GST invoice</span></div>
          <div><strong>3</strong><span>Dealer roles</span></div>
        </section>

        <section id="services" className="section">
          <div className="section-heading">
            <span className="eyebrow">Services</span>
            <h2>IT, digital, and automation services</h2>
          </div>
          <div className="service-grid">
            {services.map(([title, body]) => (
              <article className="service-card" key={title}>
                <Headphones size={24} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="catalogue" className="section catalogue-section">
          <div className="section-heading">
            <span className="eyebrow">Product catalogue</span>
            <h2>Hardware with instant quote and checkout</h2>
          </div>
          <div className="catalogue-toolbar">
            <div className="search-pill"><Search size={18} /> Browse business IT products</div>
            <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Pricing role">
              <option value="customer">Customer pricing</option>
              <option value="dealer">Dealer pricing</option>
            </select>
          </div>
          <div className="category-tabs">
            {categories.map((category) => (
              <button className={category === activeCategory ? "active" : ""} onClick={() => setActiveCategory(category)} key={category}>{category}</button>
            ))}
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <img src={product.image} alt={product.name} loading="lazy" />
                <div className="product-body">
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.sku} · Stock {product.stock}</p>
                  <strong>Starting {currency(role === "dealer" ? product.dealerPrice : product.price)}</strong>
                  <div className="product-actions">
                    <a href={whatsappUrl(`I need price details for ${product.name} (${product.sku}).`)}><MessageCircle size={17} /> WhatsApp</a>
                    <button onClick={() => checkout(product)}><BadgeIndianRupee size={17} /> Buy Now</button>
                  </div>
                  <button className="cart-btn" onClick={() => addToCart(product)}><ShoppingCart size={17} /> Add to bulk cart</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="offers" className="section offers-section">
          <div className="section-heading">
            <span className="eyebrow">Combo offers</span>
            <h2>Ready bundles for offices and stores</h2>
          </div>
          <div className="offer-grid">
            <article><Building2 /><h3>New Office Setup</h3><p>5 desktops, WiFi, printer, firewall, CCTV, and backup.</p><strong>From {currency(149999)}</strong></article>
            <article><ShieldCheck /><h3>Retail Security Kit</h3><p>8 cameras, DVR, PoE switch, storage, remote viewing.</p><strong>From {currency(42999)}</strong></article>
            <article><Laptop /><h3>Dealer Laptop Pack</h3><p>10 business laptops with dealer price and GST billing.</p><strong>Bulk quote</strong></article>
          </div>
        </section>

        <section id="bulk" className="section split-section">
          <div>
            <span className="eyebrow">Bulk enquiry</span>
            <h2>Send requirements. Get a GST quote.</h2>
            <p>Use this form for office setup, AMC, CCTV installation, networking projects, website development, SEO packages, and dealer bulk orders.</p>
            <div className="cart-summary">
              <h3>Bulk cart</h3>
              {cart.length === 0 ? <p>No products added.</p> : cart.map((item) => <p key={item.id}>{item.qty} x {item.name} - {currency(item.price * item.qty)}</p>)}
              <strong>Total: {currency(cartTotal)}</strong>
              <button disabled={!cart.length} onClick={() => checkout()}>Checkout bulk cart</button>
            </div>
          </div>
          <form className="lead-form" onSubmit={submitLead}>
            <input name="name" required placeholder="Name" />
            <input name="phone" required placeholder="Phone / WhatsApp" />
            <input name="email" type="email" placeholder="Email" />
            <select name="interest" defaultValue="Laptop/Desktop">
              <option>Laptop/Desktop</option>
              <option>CCTV</option>
              <option>Networking</option>
              <option>Server</option>
              <option>Website / SEO</option>
              <option>Dealer bulk order</option>
            </select>
            <textarea name="message" rows="4" placeholder="Requirement details" />
            <button type="submit">Submit enquiry</button>
            <p>{leadStatus}</p>
          </form>
        </section>

        <section id="admin" className="section admin-section">
          <div className="section-heading">
            <span className="eyebrow">ERP + dealer portal</span>
            <h2>Admin, staff, and dealer operations</h2>
          </div>
          <div className="admin-layout">
            <aside>
              <button className="active"><UserCog size={18} /> Admin</button>
              <button><Boxes size={18} /> Stock</button>
              <button><ClipboardList size={18} /> Orders</button>
              <button><Building2 size={18} /> Dealers</button>
            </aside>
            <div className="admin-table">
              <AuthPanel user={authUser} profile={profile} />
              <div className="table-head"><span>Product</span><span>SKU</span><span>Price</span><span>Dealer</span><span>Stock</span><span>Status</span></div>
              {products.slice(0, 6).map((product) => (
                <div className="table-row" key={product.id}>
                  <span>{product.name}</span>
                  <span>{product.sku}</span>
                  <span>{currency(product.price)}</span>
                  <span>{currency(product.dealerPrice)}</span>
                  <span>{product.stock}</span>
                  <span className={product.stock <= 5 ? "low" : "ok"}>{product.stock <= 5 ? "Low stock" : "Ready"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="blog" className="section blog-section">
          <div className="section-heading">
            <span className="eyebrow">SEO blog</span>
            <h2>Local IT buying guides</h2>
          </div>
          <div className="blog-grid">
            {blogPosts.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p><a href="#bulk">Request help</a></article>)}
          </div>
        </section>

        <section id="contact" className="contact-band">
          <h2>VKP Technologies</h2>
          <p>IT services, laptop repair, CCTV installation, website development, SEO services, hardware sales, and dealer support in Coimbatore.</p>
          <div>
            <a href={`tel:${import.meta.env.VITE_CALL_NUMBER || "+919876543210"}`}><Phone size={18} /> Call</a>
            <a href={whatsappUrl("Hi VKP Technologies, I need support.")}><MessageCircle size={18} /> WhatsApp</a>
          </div>
        </section>
      </main>

      <a className="floating-whatsapp" href={whatsappUrl("Hi VKP Technologies, I need a quotation.")} aria-label="WhatsApp VKP Technologies"><MessageCircle /></a>
      <a className="floating-call" href={`tel:${import.meta.env.VITE_CALL_NUMBER || "+919876543210"}`} aria-label="Call VKP Technologies"><Phone /></a>
    </>
  );
}

function AuthPanel({ user, profile }) {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  async function handleAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    setMessage("Processing...");
    try {
      if (mode === "signup") {
        await signup(email, password, form.get("role"), form.get("businessName"));
        setMessage("Account created. Admin approval is required before dealer pricing is enabled.");
      } else {
        await login(email, password);
        setMessage("Logged in.");
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (user) {
    return (
      <div className="auth-panel">
        <div>
          <strong>{user.email}</strong>
          <span>{profile?.approved ? `${profile.role} approved` : "Approval pending"}</span>
        </div>
        <button onClick={() => logout()}>Logout</button>
      </div>
    );
  }

  return (
    <form className="auth-panel auth-form" onSubmit={handleAuth}>
      <div className="auth-tabs">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Signup</button>
      </div>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required minLength="6" />
      {mode === "signup" && (
        <>
          <input name="businessName" placeholder="Business name" />
          <select name="role" defaultValue="dealer">
            <option value="dealer">Dealer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </>
      )}
      <button type="submit">{mode === "signup" ? "Create account" : "Login"}</button>
      <p>{message}</p>
    </form>
  );
}

createRoot(document.getElementById("root")).render(<App />);
