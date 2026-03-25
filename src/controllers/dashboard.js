
import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "../Model/database.js";

// Récupération utilisateur
const user = JSON.parse(sessionStorage.getItem("currentUser"));

// Guard authentication
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// ------------------- DOM elements -------------------
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");

// Transfer popup
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");
const transferAmountInput = document.getElementById("amount");

// Recharge popup
const rechargeBtn = document.getElementById("quickTopup");
const rechargeSection = document.getElementById("rechargePopup");
const closeRechargeBtn = document.getElementById("closeRechargeBtn");
const cancelRechargeBtn = document.getElementById("cancelRechargeBtn");
const submitRechargeBtn = document.getElementById("submitRechargeBtn");
const rechargeCardSelect = document.getElementById("rechargeCard");
const rechargeAmountInput = document.getElementById("rechargeAmount");

// ------------------- Events -------------------
transferBtn.addEventListener("click", handleTransfersection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);

rechargeBtn.addEventListener("click", () => {
  if (user.wallet.cards.length === 0) {
    alert("Vous devez d'abord ajouter une carte pour recharger votre wallet.");
    return;
  }
  renderRechargeCards();
  rechargeSection.classList.add("active");
  document.body.classList.add("popup-open");
});
closeRechargeBtn.addEventListener("click", closeRecharge);
cancelRechargeBtn.addEventListener("click", closeRecharge);
submitRechargeBtn.addEventListener("click", handleRecharge);

// ------------------- Dashboard -------------------
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard() {
  const dashboardData = getDashboardData();
  if (dashboardData) {
    greetingName.textContent = dashboardData.userName;
    currentDate.textContent = dashboardData.currentDate;
    solde.textContent = dashboardData.availableBalance;
    incomeElement.textContent = dashboardData.monthlyIncome;
    expensesElement.textContent = dashboardData.monthlyExpenses;
    activecards.textContent = dashboardData.activeCards;
  }

  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach(transaction => {
    const transactionItem = document.createElement("div");
    transactionItem.className = "transaction-item";
    transactionItem.innerHTML = `
      <div>${transaction.date}</div>
      <div>${transaction.amount} MAD</div>
      <div>${transaction.type}</div>
    `;
    transactionsList.appendChild(transactionItem);
  });
}
renderDashboard();

// ------------------- Transfer -------------------
function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);
function renderBeneficiaries() {
  beneficiaries.forEach((b) => {
    const option = document.createElement("option");
    option.value = b.id;
    option.textContent = b.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();

function renderCards() {
  sourceCard.innerHTML = "";
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = `${card.type} ****${card.numcards}`;
    sourceCard.appendChild(option);
  });
}
renderCards();

// ------------------- Transfer Promises -------------------
function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const beneficiary = finduserbyaccount(numcompte);
      beneficiary ? resolve(beneficiary) : reject("Bénéficiaire introuvable");
    }, 2000);
  });
}

function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      expediteur.wallet.balance >= amount ? resolve("Solde suffisant") : reject("Solde insuffisant");
    }, 1000);
  });
}

function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("Solde mis à jour");
    }, 200);
  });
}

function addtransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const debit = {
        id: Date.now(),
        type: "debit",
        amount,
        date: new Date().toLocaleString(),
        to: destinataire.name,
      };
      const credit = {
        id: Date.now(),
        type: "credit",
        amount,
        date: new Date().toLocaleString(),
        from: expediteur.name,
      };
      expediteur.wallet.transactions.push(debit);
      destinataire.wallet.transactions.push(credit);
      resolve("Transaction ajoutée");
    }, 300);
  });
}

function transfer(expediteur, numcompte, amount) {
  checkUser(numcompte)
    .then(destinataire => checkSolde(expediteur, amount).then(() => destinataire))
    .then(destinataire => updateSolde(expediteur, destinataire, amount).then(() => destinataire))
    .then(destinataire => addtransactions(expediteur, destinataire, amount))
    .then(msg => {
      console.log(msg);
      alert("Transfert réussi !");
      renderDashboard();
      closeTransfer();
    })
    .catch(err => alert("Erreur : " + err));
}

function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = beneficiarySelect.value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const amount = Number(transferAmountInput.value);
  transfer(user, beneficiaryAccount, amount);
}

// ------------------- Recharge -------------------
function closeRecharge() {
  rechargeSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function renderRechargeCards() {
  rechargeCardSelect.innerHTML = "";
  user.wallet.cards.forEach(card => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = `${card.type} ****${card.numcards}`;
    rechargeCardSelect.appendChild(option);
  });
}

function checkCard(cardNumber) {
  return new Promise((resolve, reject) => {
    const card = user.wallet.cards.find(c => c.numcards === cardNumber);
    if (!card) return reject("Carte introuvable ou non associée à votre compte");
    const [month, year] = card.expiry.split("/").map(Number);
    const expiryDate = new Date(`20${year}`, month, 0); // dernier jour du mois
    if (expiryDate < new Date()) return reject("Carte expirée");
    resolve(card);
  });
}

function checkAmount(amount) {
  return new Promise((resolve, reject) => {
    if (!amount || amount <= 0) return reject("Montant invalide");
    const MIN = 10;
    const MAX = 10000;
    if (amount < MIN) return reject(`Montant doit être ≥ ${MIN} MAD`);
    if (amount > MAX) return reject(`Montant doit être ≤ ${MAX} MAD`);
    resolve(amount);
  });
}

function updateWalletBalance(user, amount) {
  return new Promise(resolve => {
    user.wallet.balance += amount;
    resolve(true);
  });
}

function addRechargeTransaction(user, card, amount, status = "SUCCESS") {
  return new Promise(resolve => {
    user.wallet.transactions.push({
      id: Date.now(),
      type: "RECHARGE",
      amount,
      date: new Date().toLocaleString(),
      card: card.numcards,
      status
    });
    resolve("Recharge enregistrée");
  });
}

function handleRecharge(e) {
  e.preventDefault();
  const cardNumber = rechargeCardSelect.value;
  const amount = Number(rechargeAmountInput.value);

  checkCard(cardNumber)
    .then(card => checkAmount(amount).then(() => card))
    .then(card => updateWalletBalance(user, amount).then(() => card))
    .then(card => addRechargeTransaction(user, card, amount))
    .then(() => {
      alert("Recharge effectuée !");
      renderDashboard();
      closeRecharge();
    })
    .catch(err => {
      if (rechargeCardSelect.value) {
        addRechargeTransaction(user, { numcards: rechargeCardSelect.value }, Number(rechargeAmountInput.value), "FAILED");
      }
      alert("Erreur : " + err);
    });
}