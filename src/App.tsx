import { useState } from "react";
import { Navbar } from "./Components/Navbar";
import { RecipeCard } from "./Components/RecipeCard";
import CameraPhoto from "./Components/CameraPhoto";
import { authService } from "./supabase_util";

const SAMPLE_RECIPES = [
  { id: "1", title: "Seasoned Rice With Tomatos", timeStamp: "1 Day Ago" },
  { id: "2", title: "Franch Toast & Cheese Omlette", timeStamp: "3 Days Ago" },
  { id: "3", title: "Roasted Matshmellow Cookies", timeStamp: "4 Days Ago" },
  { id: "4", title: "Masturd Marinade Chicken", timeStamp: "7 Days Ago" },
  { id: "5", title: "Fried Bread", timeStamp: "11 Days Ago" },
] as const;

function App() {

  // registery states.

  const [regUserName, setRegUserName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  //navigation flag states. 

  const [enteredName, setEnteredName] = useState("");
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState(false);
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); 
  const [showFields, setShowFields] = useState(false);

  //handle register function connecting app.tsx to utility file supabase util.

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      await authService.register({
        userName: regUserName,
        email: regEmail,
        password: regPassword
      });
      alert("Account Created!")
      setIsRegistering(false)
    } catch (err : any) {
      alert(err.message);
    }
  }

  //check for navigation, sign in or register, according to flags true or false values. 

  if (!hasEnteredDashboard) {

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <section className="flex w-full max-w-md flex-col rounded-2xl p-6 shadow-md" style={{ backgroundColor: "#C5D89D" }}>
          
          <img
            src={'/src/assets/snapchef_logo.png'}
            alt="SnapChef"
            className="mx-auto m-5 h-auto w-28 shrink-0 object-contain sm:w-42 md:w-46"
          />
  
          {/*Registery Stage?*/}

          {isRegistering ? (

          <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-in fade-in duration-300">

            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-gray-800 text-center text-green-900">Create Account</h2>
              <p className="text-sm text-gray-600 text-center">Join the SnapChef community</p>
              
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Choose Username"
                  value={regUserName}
                  onChange={(e) => setRegUserName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                />
                <input
                  type="password"
                  placeholder="Choose Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                />
              </div>
  
              <button className="mt-4 w-full rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-green-900">
                Sign Up
              </button>
  
              <button 
                onClick={() => setIsRegistering(false)} 
                className="text-xs text-green-900 underline mt-2"
              >
                Back to Login
              </button>

            </div>

            </form>

          ) : (

            /* if not registry phase, show field and sign in? */
            <>
              {!showFields ? (
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-sm text-gray-600">Sign in to access your kitchen.</p>
                  <button
                    onClick={() => setShowFields(true)}
                    className="mt-4 w-full rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-green-900"
                  >
                    Sign In
                  </button>
                  
                  {/* go to SignIn screen by button*/}

                  <button 
                    onClick={() => setIsRegistering(true)} 
                    className="text-sm text-green-900 hover:underline font-medium mt-2"
                  >
                    Don't have an account? Register now
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={enteredName}
                      onChange={(e) => setEnteredName(e.target.value)}
                      placeholder="Username"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                    />
                  </div>
  
                  <button
                    onClick={() => setHasEnteredDashboard(true)}
                    disabled={!enteredName.trim() || !password.trim()}
                    className="mt-4 w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
                  >
                    Enter SnapChef
                  </button>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={() => setShowFields(false)} 
                      className="text-xs text-green-900 underline opacity-70"
                    >
                      Go Back
                    </button>
                    <button 
                      onClick={() => setIsRegistering(true)} 
                      className="text-xs text-green-900 hover:underline font-medium"
                    >
                      Need an account? Register
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pt-6 sm:px-8">
      <Navbar />

  
      <main className="mx-auto mt-6 w-full max-w-5xl space-y-6">
        <section className="flex w-full justify-center">
          <div className="w-full max-w-md">
            <CameraPhoto />
          </div>
        </section>

        <section className="w-full md:w-[360px]">
          <div className="space-y-4 text-left">
            {SAMPLE_RECIPES.map((recipe) => (
              <RecipeCard key={recipe.id} title={recipe.title} timestemp={recipe.timeStamp} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
