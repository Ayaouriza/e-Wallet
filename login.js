console.log("login.js chargé !");
import finduserbymail from "./database.js";


const mailInput = document.getElementById("mail");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitbtn");
const errorDiv = document.getElementById("error");
const result = document.getElementById("result");
const display = document.getElementById("display");


display.addEventListener("click", handleTogglePassword);
submitBtn.addEventListener("click", handleSubmit);


function handleTogglePassword() {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        display.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        display.textContent = "👁";
    }
}


function checkEmptyFields(email, password) {
    if (email === '' || password === '') {
        errorDiv.textContent = "Veuillez remplir tous les champs !";
        errorDiv.style.color = "red";
        return true;
    }
    return false;
}


function showLoading() {
    submitBtn.textContent = "Vérification...";
    submitBtn.disabled = true;
    errorDiv.textContent = "";
}


function showSuccess(user) {
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    result.textContent = "Connexion réussie !";
    result.style.color = "green";
    setTimeout(redirectToDashboard, 1000);
}

function redirectToDashboard() {
    window.location.href = "dashboard.html";
}


function showError() {
    errorDiv.textContent = "Email ou mot de passe incorrect !";
    errorDiv.style.color = "red";
    submitBtn.textContent = "Se connecter";
    submitBtn.disabled = false;
}


function checkUser(email, password) {
    const user = finduserbymail(email, password);
    if (user) {
        showSuccess(user);
    } else {
        showError();
    }
}


function handleSubmit() {
    const email = mailInput.value;
    const password = passwordInput.value;

    if (checkEmptyFields(email, password)) return;

    showLoading();

    setTimeout(function() {
        checkUser(email, password);
    }, 2500);
}