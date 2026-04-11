import {Text,View,TextInput,Button} from 'react-native';import React,{useState} from 'react';import axios from 'axios';
export default function App(){
const [income,setIncome]=useState('');
const calc=async()=>{const r=await axios.post('http://YOUR_IP:5000/api/tax/paye',{income});alert(r.data.tax)};
return(<View><Text>Mobile Tax</Text><TextInput onChangeText={setIncome}/><Button title="Calc" onPress={calc}/></View>)}
