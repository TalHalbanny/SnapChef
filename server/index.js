const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase_db_password = process.env.PASSWORD;
const supabase_url = process.env.SUPABASE_URL;
const supabase_db_name = process.env.DATABASENAME;
const supabase_anon = process.env.ANON_KEY_URL;

const supabase_connect = supabase.createClient(supabase_url, supabase_db_password);


const PORT = 5000;



app.listen(PORT, () => { console.log('Server is Running on port 5000'); });