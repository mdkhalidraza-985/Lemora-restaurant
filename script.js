/* ========== 1. RESTAURANT SETTINGS ========== */

// WhatsApp number: country code + number, digits only.
const RESTAURANT_WHATSAPP = "91xxxxxxxxxx";

// Replace this placeholder with your verified merchant UPI ID.
const RESTAURANT_UPI_ID = "YOUR_REAL_UPI_ID_HERE";

const RESTAURANT_NAME = "Lemora x Restaurant";

/* ========== 2. SELECT HTML ELEMENTS ========== */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

const cartItemsElement = document.getElementById("cartItems");
const cartCountElement = document.getElementById("cartCount");
const cartSummaryCount = document.getElementById("cartSummaryCount");
const cartTotalElement = document.getElementById("cartTotal");
const paymentTotalElement = document.getElementById("paymentTotal");

const toastElement = document.getElementById("toast");
const paymentHint = document.getElementById("paymentHint");

const checkoutButton = document.getElementById("whatsappCheckout");

// Store selected food items in the cart.
const cart = new Map();

let toastTimer;

/* ========== 3. MOBILE HAMBURGER MENU ========== */

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  // Close mobile menu after clicking a navigation link.
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });
}

/* ========== 4. TOAST NOTIFICATION ========== */

function showToast(message) {
  if (!toastElement) {
    alert(message);
    return;
  }

  toastElement.textContent = message;
  toastElement.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastElement.classList.remove("show");
  }, 2600);
}

/* ========== 5. CART COUNT AND BILL CALCULATION ========== */

// Calculate the total quantity of all cart items.
function getCartCount() {
  let count = 0;

  cart.forEach((item) => {
    count += item.quantity;
  });

  return count;
}

// Calculate the total bill.
function getCartTotal() {
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;
  });

  return total;
}

// Display amounts in Indian Rupees.
function formatRupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

/* ========== 6. ADD FOOD ITEM TO CART ========== */

function addItem(name, price) {
  const existingItem = cart.get(name);

  if (existingItem) {
    // Increase quantity if the item is already in the cart.
    existingItem.quantity += 1;
  } else {
    // Add a new food item.
    cart.set(name, {
      name,
      price,
      quantity: 1
    });
  }

  renderCart();
  showToast(`${name} added to your cart.`);
}

/* ========== 7. INCREASE OR DECREASE QUANTITY ========== */

function changeQuantity(name, change) {
  const item = cart.get(name);

  if (!item) return;

  item.quantity += change;

  // Remove the item when quantity reaches zero.
  if (item.quantity <= 0) {
    cart.delete(name);
  }

  renderCart();
}

/* ========== 8. DISPLAY CART AND AUTOMATIC TOTAL ========== */

function renderCart() {
  const count = getCartCount();
  const total = getCartTotal();

  // Update navbar cart badge.
  if (cartCountElement) {
    cartCountElement.textContent = String(count);
  }

  // Update cart item count.
  if (cartSummaryCount) {
    cartSummaryCount.textContent =
      `${count} ${count === 1 ? "item" : "items"}`;
  }

  // Update cart and payment totals.
  if (cartTotalElement) {
    cartTotalElement.textContent = formatRupees(total);
  }

  if (paymentTotalElement) {
    paymentTotalElement.textContent = formatRupees(total);
  }

  if (!cartItemsElement) return;

  // Display an empty cart message.
  if (cart.size === 0) {
    cartItemsElement.innerHTML = `
      <p class="empty-cart">
        Your cart is empty. Add something delicious from the menu.
      </p>
    `;
    return;
  }

  cartItemsElement.innerHTML = "";

  // Create a cart row for every selected item.
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const details = document.createElement("div");

    const name = document.createElement("div");
    name.className = "cart-item-name";
    name.textContent = item.name;

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    // Decrease quantity button.
    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.textContent = "−";
    minusButton.setAttribute("aria-label", `Remove one ${item.name}`);

    minusButton.addEventListener("click", () => {
      changeQuantity(item.name, -1);
    });

    // Current quantity.
    const quantity = document.createElement("span");
    quantity.textContent = String(item.quantity);

    // Increase quantity button.
    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", `Add one ${item.name}`);

    plusButton.addEventListener("click", () => {
      changeQuantity(item.name, 1);
    });

    controls.append(minusButton, quantity, plusButton);
    details.append(name, controls);

    // Calculate price for this item's quantity.
    const price = document.createElement("div");
    price.className = "cart-item-price";
    price.textContent = formatRupees(item.price * item.quantity);

    row.append(details, price);
    cartItemsElement.appendChild(row);
  });
}

/* ========== 9. MENU ADD BUTTONS ========== */

// Works with buttons using data-add and data-price.
document.querySelectorAll("[data-add][data-price]").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.add;
    const price = Number(button.dataset.price);

    if (!name || !Number.isFinite(price) || price < 0) {
      showToast("This menu item has invalid details.");
      return;
    }

    addItem(name, price);
  });
});

/* ========== 10. WHATSAPP ORDER CHECKOUT ========== */

if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    // Prevent checkout if the cart is empty.
    if (cart.size === 0) {
      showToast("Please add an item to your cart first.");
      return;
    }

    // Validate the restaurant WhatsApp number.
    if (!/^\d{10,15}$/.test(RESTAURANT_WHATSAPP)) {
      showToast("Please configure the WhatsApp number in script.js.");
      return;
    }

    // Prepare the list of selected items.
    const orderLines = Array.from(cart.values(), (item) => {
      const itemTotal = item.price * item.quantity;

      return `• ${item.name} × ${item.quantity} = ${formatRupees(itemTotal)}`;
    });

    // Build the message that appears in WhatsApp.
    const message = [
      `Hello ${RESTAURANT_NAME}! I would like to place an order:`,
      "",
      ...orderLines,
      "",
      `Total amount: ${formatRupees(getCartTotal())}`,
      "",
      "Please confirm availability and delivery or pickup details. Thank you!"
    ].join("\n");

    const whatsappURL =
      `https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp with the prepared order.
    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  });
}

/* ========== 11. UPI PAYMENT CONFIGURATION ========== */

function isUpiConfigured() {
  return (
    RESTAURANT_UPI_ID !== "YOUR_REAL_UPI_ID_HERE" &&
    /^[\w.-]+@[\w.-]+$/.test(RESTAURANT_UPI_ID)
  );
}

/* ========== 12. OPEN UPI PAYMENT APP ========== */

function openUpiPayment(app) {
  const total = getCartTotal();

  // Payment requires a non-empty cart.
  if (total <= 0) {
    showToast("Add menu items to your cart before paying.");
    return;
  }

  // Prevent payments using a placeholder UPI ID.
  if (!isUpiConfigured()) {
    if (paymentHint) {
      paymentHint.textContent =
        "Add the restaurant's verified UPI ID in script.js before making payments.";
    }

    showToast("Restaurant UPI ID is not configured.");
    return;
  }

  // Create a standard UPI payment request.
  const params = new URLSearchParams({
    pa: RESTAURANT_UPI_ID,
    pn: RESTAURANT_NAME,
    am: total.toFixed(2),
    cu: "INR",
    tn: "Food order from website"
  });

  const upiURL = `upi://pay?${params.toString()}`;

  // The device chooses which compatible app opens.
  const supportedOptions = {
    gpay: upiURL,
    phonepe: upiURL,
    paytm: upiURL,
    upi: upiURL
  };

  window.location.href = supportedOptions[app] || upiURL;
}

// Connect all payment buttons.
document.querySelectorAll("[data-app]").forEach((button) => {
  button.addEventListener("click", () => {
    openUpiPayment(button.dataset.app);
  });
});

/* ========== 13. CURRENT COPYRIGHT YEAR ========== */

const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

/* ========== 14. INITIALIZE CART ========== */

// Render the empty cart when the page loads.
renderCart();
