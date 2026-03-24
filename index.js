//récupération des élements DOM
const loginbtn=document.getElementById("Loginbtn");
loginbtn.addEventListener("click",handlelogin);
function handlelogin(){
    loginbtn.textContent= "Loading...";
    setTimeout(()=>{
        document.location="login.html";
    }, 1000);
    
}