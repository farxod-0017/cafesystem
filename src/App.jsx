import { Route, Routes } from 'react-router'
import './App.css'
import Login from './pages/Login/Login'
import RequireAuth from './auth/RequireAuth'
import AdminLayout from './layouts/AdminLayout'
import adminRoutes from './utils/routes/adminRoutes'
import { Toaster } from 'react-hot-toast'
import ErrorPage from './pages/ErrorPage'

function App() {

  return (
    <>
      <Routes>
        <Route path='/login' element={<Login/>}/>
        <Route element={<RequireAuth/>}>
          <Route element={<AdminLayout/>}>
            {adminRoutes.map((r)=> {
              return (
                <Route key={r.name} path={r.path} element={r.element}/>
              )
            })}
          </Route>
        </Route>
        <Route path='*' element={<ErrorPage/>}/>
      </Routes>
      <Toaster
        position='top-center'
        toastOptions={{
          duration:3000,
        }}
      />
    </>
  )
}

export default App
