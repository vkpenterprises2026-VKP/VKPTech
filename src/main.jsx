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
