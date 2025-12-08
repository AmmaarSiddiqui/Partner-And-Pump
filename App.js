import "react-native-gesture-handler";
import AppNavigator from "./app/navigation/AppNavigator";
import { AuthProvider } from "./app/state/useAuthContext";
import { MatchesProvider } from "./app/state/useMatchesContext";
//import test from "./app/src/API/googlePlaces.js"
export default function App() {
  return (
    <AuthProvider>
      <MatchesProvider>
        <AppNavigator />
      </MatchesProvider>
    </AuthProvider>
  );
}