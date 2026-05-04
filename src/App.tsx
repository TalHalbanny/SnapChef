import { useState } from "react";
import { Navbar } from "./Components/Navbar";
import { RecipeCard } from "./Components/RecipeCard";
import CameraPhoto from "./Components/CameraPhoto";

const SAMPLE_RECIPES = [
  { id: "1", title: "Seasoned Rice With Tomatos", timeStamp: "1 Day Ago" },
  { id: "2", title: "Franch Toast & Cheese Omlette", timeStamp: "3 Days Ago" },
  { id: "3", title: "Roasted Matshmellow Cookies", timeStamp: "4 Days Ago" },
  { id: "4", title: "Masturd Marinade Chicken", timeStamp: "7 Days Ago" },
  { id: "5", title: "Fried Bread", timeStamp: "11 Days Ago" },
] as const;

function App() {

  const [enteredName, setEnteredName] = useState("");
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState(false);
  const [password, setPassword] = useState("");

  if (!hasEnteredDashboard) {
    return (

      <div className="flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-md" style={{ backgroundColor: "#C5D89D" }}>
          
          <img
          src={'/src/assets/snapchef_logo.png'}
          alt="SnapChef"
          className="h-auto w-28 shrink-0 object-contain sm:w-42 md:w-46 mx-auto m-5"/>

          <p className="mt-3 text-sm text-gray-600">
            Please Enter Username & Password
          </p>

          <label htmlFor="user-name" className="mt-5 block text-sm font-medium text-gray-700">
            Username
          </label>

          <input
            id="user-name"
            type="text"
            value={enteredName}
            onChange={(event) => setEnteredName(event.target.value)}
            placeholder="Username"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700 bg-white"
          />

          <label htmlFor="password" className="mt-5 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700 bg-white"
          />

          <button
            type="button"
            onClick={() => setHasEnteredDashboard(true)}
            disabled={!enteredName.trim()}
            className="mt-7 w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enter SnapChef
          </button>
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
