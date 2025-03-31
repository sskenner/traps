import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";

// Import pages and components
import HomePage from "./pages/index";
import NotFound from "./pages/not-found";

function App() {
  const [initialized, setInitialized] = useState(false);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Initialize audio elements
  useEffect(() => {
    if (!initialized) {
      // Load background music
      const bgMusic = new Audio("/sounds/background.mp3");
      bgMusic.loop = true;
      bgMusic.volume = 0.4;
      setBackgroundMusic(bgMusic);

      // Load sound effects
      const hit = new Audio("/sounds/hit.mp3");
      hit.volume = 0.3;
      setHitSound(hit);

      const success = new Audio("/sounds/success.mp3");
      success.volume = 0.5;
      setSuccessSound(success);

      setInitialized(true);
    }
  }, [initialized, setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
