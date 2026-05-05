const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');


const app = express();
app.use(cors());
app.use(express.json());

const supabase_url = process.env.SUPABASE_URL;
const supabase_anon = process.env.ANON_KEY_URL;
const service_key = process.env.SERVICE_ROLE_KEY;

const supabase_connect = createClient(supabase_url, service_key);


const PORT = 5000;

app.post('/api/register', async (req, res) => {
    const { userName, email, password } = req.body;
  
    if (!userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    try {
      const { data, error } = await supabase_connect
        .from('users') 
        .insert([
          { 
            username: userName, 
            email: email, 
            password: password 
          }
        ])
        .select();
  
      if (error) {
        throw error;
      }
        res.status(201).json({ 
        message: "User created successfully!", 
        user: data[0] 
      });
  
    } catch (error) {
      console.error("Error inserting user:", error.message);
      res.status(500).json({ message: "Database error", error: error.message });
    }
  });



app.listen(PORT, () => { console.log('Server is Running on port 5000'); });