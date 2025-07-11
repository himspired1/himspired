"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { P } from '@/components/common/typography';
import Button from '@/components/common/button/button.component';

const AdminLogin = () => {
 const [credentials, setCredentials] = useState({
   username: '',
   password: ''
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const router = useRouter();

 useEffect(() => {
   const checkAuth = () => {
     const localAuth = localStorage.getItem('adminAuth');
     if (localAuth === 'true') {
       router.push('/admin/orders');
     }
   };

   checkAuth();
 }, [router]);

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);
   setError('');

   try {
     const response = await fetch('/api/admin/auth', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(credentials),
     });

     const data = await response.json();

     if (data.success) {
       localStorage.setItem('adminAuth', 'true');
       router.push('/admin/orders');
     } else {
       setError(data.error || 'Invalid credentials');
     }
   } catch  {
     if (credentials.username === 'admin' && credentials.password === 'himspired2025') {
       localStorage.setItem('adminAuth', 'true');
       router.push('/admin/orders');
     } else {
       setError('Login failed. Please try again.');
     }
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
     <motion.div
       className="max-w-md w-full bg-white rounded-lg shadow-md p-8"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
     >
       <div className="text-center mb-8">
         <h1 className="text-2xl font-moon font-bold" style={{ color: '#68191E' }}>
           HIMSPIRED
         </h1>
         <P className="text-gray-600 mt-2">Admin Dashboard</P>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6">
         <div>
           <input
             type="text"
             placeholder="Username"
             value={credentials.username}
             onChange={(e) => setCredentials({
               ...credentials,
               username: e.target.value
             })}
             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
             required
           />
         </div>

         <div>
           <input
             type="password"
             placeholder="Password"
             value={credentials.password}
             onChange={(e) => setCredentials({
               ...credentials,
               password: e.target.value
             })}
             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
             required
           />
         </div>

         {error && (
           <div className="bg-red-50 border border-red-200 rounded-lg p-3">
             <P className="text-red-600 text-sm">{error}</P>
           </div>
         )}

         <Button
           type="submit"
           btnTitle="Login"
           loading={loading}
           className="w-full bg-[#68191E] hover:bg-[#5a1519] rounded-lg"
         />
       </form>
     </motion.div>
   </div>
 );
};

export default AdminLogin;