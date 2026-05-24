import { useState } from "react";
import { Navbar } from "./Components/Navbar";
import { RecipeCard } from "./Components/RecipeCard";
import CameraPhoto from "./Components/CameraPhoto";
import { authService } from "./supabase_util";
import { GoogleGenerativeAI } from "@google/generative-ai"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_FLASH_3_KEY || "");

interface Recipe {
  id: string;
  title: string;
  timeStamp: string;
  content: string;
}

function App() {

  // registry states.
  const [regUserName, setRegUserName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // login states 
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  // navigation flag states. 
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 
  const [showFields, setShowFields] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [GetImage, setImage] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // handle register function
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await authService.register({
        userName: regUserName,
        email: regEmail,
        password: regPassword
      });
      alert("Account Created! You can now log in.");
      setIsRegistering(false);
      setRegUserName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await authService.login({
        email: loginEmail,
        password: password
      });
      setHasEnteredDashboard(true);
    } catch (err: any) {
      alert(`Login Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //Analyze and get recipe from Gemini Flash API

  const analyzeImageAndGetRecipe = async () => {

    if (!GetImage) {
      alert("Please take a photo first! The app didn't receive the image data yet.");
      return;
    }

    setIsAnalyzing(true);
    console.log("Processing Image With Gemini 1.5 Flash...");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = GetImage.split(',')[1];
      const imageParts = [{
        inlineData: {
          data: base64Data,
          mimeType: "image/png"
        },
      }];

      const prompt = `Analyze the products in this image. 
      Create a detailed and delicious recipe using these ingredients. 
      The output must be a valid JSON object with exactly two fields: 'title' (a short, catchy title) and 'content' (the full, detailed recipe). 
      Do not add any additional text or formatting. Output only the JSON.`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      const cleanJsonText = text.replace(/```json|```/g, "").trim();
      const resultData = JSON.parse(cleanJsonText);

      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: resultData.title,
        timeStamp: "Just Now",
        content: resultData.content
      };

      setRecipes(prevRecipes => [newRecipe, ...prevRecipes]);
      setImage(null); 

    } catch (err: any) {
      console.error("Error Loading Data From Gemini:", err);
      alert(`Error analyzing image: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasEnteredDashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <section className="flex w-full max-w-md flex-col rounded-2xl p-6 shadow-md" style={{ backgroundColor: "#C5D89D" }}>
          <img
            src={'/src/assets/snapchef_logo.png'}
            alt="SnapChef"
            className="mx-auto m-5 h-auto w-28 shrink-0 object-contain sm:w-42 md:w-46"
          />
  
          {/* Register Stage */}
          {isRegistering ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-center text-green-900">Create Account</h2>
                <p className="text-sm text-gray-600 text-center">Join the SnapChef community</p>
                
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Choose Username"
                    value={regUserName}
                    onChange={(e) => setRegUserName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Choose Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                    required
                  />
                </div>
    
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-green-900 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Account..." : "Sign Up"}
                </button>
    
                <button 
                  type="button" 
                  onClick={() => { if(!isSubmitting) setIsRegistering(false); }} 
                  className="text-xs text-green-900 underline mt-2 mx-auto block"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <>
              {!showFields ? (
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-sm text-gray-600">Sign in to access your kitchen.</p>
                  <button
                    type="button"
                    onClick={() => setShowFields(true)}
                    className="mt-4 w-full rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-green-900"
                  >
                    Sign In
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(true)} 
                    className="text-sm text-green-900 hover:underline font-medium mt-2 block mx-auto"
                  >
                    Don't have an account? Register now
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700"
                      required
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
                      required
                    />
                  </div>
    
                  <button
                    type="submit"
                    disabled={isSubmitting || !loginEmail.trim() || !password.trim()}
                    className="mt-4 w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
                  >
                    {isSubmitting ? "Connecting..." : "Enter SnapChef"}
                  </button>
                  
                  <div className="flex flex-col gap-2 mt-2 text-center">
                    <button 
                      type="button"
                      onClick={() => setShowFields(false)} 
                      className="text-xs text-green-900 underline opacity-70 block mx-auto"
                    >
                      Go Back
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsRegistering(true)} 
                      className="text-xs text-green-900 hover:underline font-medium block mx-auto"
                    >
                      Need an account? Register
                    </button>
                  </div>
                </form>
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
          <div className="w-full max-w-md flex flex-col gap-4">
            
            {}
            <CameraPhoto onPhotoTaken={setImage} /> 
            
            {}
            {GetImage && <p className="text-xs text-green-800 text-center font-medium">✓ Photo captured and ready!</p>}

            <button 
              onClick={analyzeImageAndGetRecipe} 
              disabled={isAnalyzing}
              className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-green-800 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Analyzing Products...
                </span>
              ) : "Create Recipe from Photo"}
            </button>
          </div>
        </section>

        <section className="w-full md:w-[360px]">
          <div className="space-y-4 text-left">
            {recipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                title={recipe.title} 
                timestemp={recipe.timeStamp} 
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;