import { Route, Routes } from 'react-router'
import './App.css'
import Login from './pages/Login/Login'
import RequireAuth from './auth/RequireAuth'
import AdminLayout from './layouts/AdminLayout'
import adminRoutes from './utils/routes/adminRoutes'
import { Toaster } from 'react-hot-toast'
import ErrorPage from './pages/ErrorPage'
import OmborLayout from './layouts/OmborLayout'
import omborRoutes from './utils/routes/omborRoutes'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import superAdminRoutes from './utils/routes/superAdminRoutes'
import CafeLayout from './layouts/CafeLayout'
import cafeRoutes from './utils/routes/cafeRoutes'
import sellerRoutes from './utils/routes/sellerRoutes'
import SellerLayout from './layouts/SellerLayout'

function App() {
  return (
    <>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route element={<RequireAuth role="SUPER_ADMIN" />}>
          <Route path='/superadmin' element={<SuperAdminLayout />}>
            {superAdminRoutes.map((r) => {
              return (
                <Route key={r.name} path={r.path} element={r.element} />
              )
            })}
          </Route>
        </Route>
        <Route element={<RequireAuth role="ADMIN" />}>
          <Route path='/' element={<AdminLayout />}>
            {adminRoutes.map((r) => {
              return (
                <Route key={r.name} path={r.path} element={r.element} />
              )
            })}
          </Route>
        </Route>
        <Route element={<RequireAuth role={"ADMIN"} />}>
          <Route path='/ombor' element={<OmborLayout />}>
            {omborRoutes.map((r) => {
              return (
                <Route key={r.name} path={r.path} element={r.element} />
              )
            })}
          </Route>
        </Route>
        <Route element={<RequireAuth role={"ADMIN"} />}>
          <Route path='/cafe' element={<CafeLayout />}>
            {cafeRoutes.map((r) => {
              return (
                <Route key={r.name} path={r.path} element={r.element} />
              )
            })}
          </Route>
        </Route>
        <Route element={<RequireAuth role={"SELLER"} />}>
          <Route path='/seller' element={<SellerLayout />}>
            {sellerRoutes.map((r) => {
              return (
                <Route key={r.name} path={r.path} element={r.element} />
              )
            })}
          </Route>
        </Route>
        <Route path='*' element={<ErrorPage />} />
      </Routes>
      <Toaster
        position='top-center'
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  )
}

export default App
