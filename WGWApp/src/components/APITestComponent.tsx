import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { supabase } from '../config/supabase';

export const APITestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string>('');

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('users').select('count');
      if (error) throw error;
      setTestResults('✅ Supabase Connected Successfully!');
    } catch (error: any) {
      setTestResults(`❌ Supabase Error: ${error.message}`);
    }
  };

  const testEnvironmentVariables = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      setTestResults('✅ Environment variables loaded correctly!');
    } else {
      setTestResults('❌ Environment variables not loaded');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        API Test Panel
      </Text>
      
      <Button title="Test Environment Variables" onPress={testEnvironmentVariables} />
      <Button title="Test Supabase Connection" onPress={testSupabaseConnection} />
      
      {testResults ? (
        <Text style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0' }}>
          {testResults}
        </Text>
      ) : null}
    </View>
  );
};