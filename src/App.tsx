import './App.css'
import { Button, useAuthenticator } from "@aws-amplify/ui-react";

function App() {

  const { signOut } = useAuthenticator();

  return (
    <div>
      <div className='m-2 flex justify-end'>
        <Button onClick={signOut}>Logout</Button>
      </div>
      <h1 className='text-3xl underline'>Fish Tank Manager</h1>
    </div>
  )
}

export default App