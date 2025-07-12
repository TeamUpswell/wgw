import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

interface TwoTruthsAndALieProps {
  userId: string;
  isOwnProfile: boolean;
  isDarkMode: boolean;
  initialData?: {
    statement1: string;
    statement2: string;
    statement3: string;
    lie_position: number;
  };
  onSave?: (data: any) => void;
}

export const TwoTruthsAndALie: React.FC<TwoTruthsAndALieProps> = ({
  userId,
  isOwnProfile,
  isDarkMode,
  initialData,
  onSave,
}) => {
  const [statements, setStatements] = useState({
    statement1: initialData?.statement1 || '',
    statement2: initialData?.statement2 || '',
    statement3: initialData?.statement3 || '',
  });
  const [liePosition, setLiePosition] = useState(initialData?.lie_position || 1);
  const [editing, setEditing] = useState(!initialData);
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    if (!isOwnProfile) {
      checkIfAlreadyGuessed();
    }
  }, [userId]);

  const checkIfAlreadyGuessed = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data } = await supabase
        .from('truths_and_lie_guesses')
        .select('*')
        .eq('profile_user_id', userId)
        .eq('guesser_user_id', authData.user.id)
        .single();

      if (data) {
        setHasGuessed(true);
        setSelectedGuess(data.guessed_position);
        setIsCorrect(data.is_correct);
        setShowResult(true);
      }
    } catch (error) {
      console.log('No previous guess found');
    }
  };

  const handleSave = async () => {
    if (!statements.statement1 || !statements.statement2 || !statements.statement3) {
      Alert.alert('Incomplete', 'Please fill in all three statements');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          truths_and_lie: {
            ...statements,
            lie_position: liePosition,
          },
        })
        .eq('id', userId);

      if (error) throw error;

      setEditing(false);
      onSave?.({ ...statements, lie_position: liePosition });
      Alert.alert('Success', 'Your Two Truths and a Lie has been saved!');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleGuess = async (position: number) => {
    if (hasGuessed) return;

    setSelectedGuess(position);
    const correct = position === liePosition;
    setIsCorrect(correct);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      await supabase.from('truths_and_lie_guesses').insert({
        profile_user_id: userId,
        guesser_user_id: authData.user.id,
        guessed_position: position,
        is_correct: correct,
      });

      if (correct) {
        setCelebration(true);
        setTimeout(() => setCelebration(false), 3000);
      }
    } catch (error) {
      console.error('Error saving guess:', error);
    }

    setShowResult(true);
    setHasGuessed(true);
  };

  const renderStatement = (statement: string, position: number, label: string) => {
    const isLie = position === liePosition;
    const isSelected = selectedGuess === position;
    const showAsLie = showResult && isLie;
    const showAsWrongGuess = showResult && isSelected && !isCorrect;

    return (
      <TouchableOpacity
        style={[
          styles.statementCard,
          isOwnProfile && editing && isLie && styles.lieCard,
          showAsLie && styles.revealedLie,
          showAsWrongGuess && styles.wrongGuess,
          isSelected && !showResult && styles.selectedStatement,
        ]}
        onPress={() => {
          if (isOwnProfile && editing) {
            setLiePosition(position);
          } else if (!isOwnProfile && !hasGuessed) {
            handleGuess(position);
          }
        }}
        disabled={isOwnProfile && !editing}
      >
        <View style={styles.statementHeader}>
          <Text style={styles.statementLabel}>{label}</Text>
          {isOwnProfile && editing && isLie && (
            <View style={styles.lieTag}>
              <Text style={styles.lieTagText}>THE LIE</Text>
            </View>
          )}
          {showAsLie && (
            <View style={styles.resultTag}>
              <Ionicons name="close-circle" size={20} color="#E74C3C" />
              <Text style={styles.resultText}>Lie!</Text>
            </View>
          )}
          {showResult && position !== liePosition && (
            <View style={styles.truthTag}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.truthText}>Truth</Text>
            </View>
          )}
        </View>
        {editing && isOwnProfile ? (
          <TextInput
            style={styles.statementInput}
            value={statement}
            onChangeText={(text) =>
              setStatements({ ...statements, [`statement${position}`]: text })
            }
            placeholder={`Enter ${isLie ? 'a lie' : 'a truth'} about yourself...`}
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            multiline
            maxLength={100}
          />
        ) : (
          <Text style={styles.statementText}>{statement}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isOwnProfile && !editing && (!statements.statement1 || !statements.statement2 || !statements.statement3)) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setEditing(true)}
        >
          <Ionicons name="add-circle-outline" size={32} color="#FF6B35" />
          <Text style={styles.addButtonText}>Add Two Truths and a Lie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Two Truths and a Lie</Text>
        {isOwnProfile && !editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </View>

      {!isOwnProfile && !hasGuessed && (
        <Text style={styles.instructions}>
          Can you spot the lie? Tap on the statement you think is false!
        </Text>
      )}

      <View style={styles.statementsContainer}>
        {renderStatement(statements.statement1, 1, 'Statement 1')}
        {renderStatement(statements.statement2, 2, 'Statement 2')}
        {renderStatement(statements.statement3, 3, 'Statement 3')}
      </View>

      {isOwnProfile && editing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setEditing(false);
              setStatements({
                statement1: initialData?.statement1 || '',
                statement2: initialData?.statement2 || '',
                statement3: initialData?.statement3 || '',
              });
              setLiePosition(initialData?.lie_position || 1);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultMessage, isCorrect ? styles.correctMessage : styles.incorrectMessage]}>
            {isCorrect ? '🎉 Correct! You found the lie!' : '😄 Haha! Not quite right!'}
          </Text>
        </View>
      )}

      {celebration && (
        <View style={styles.celebrationOverlay}>
          <Text style={styles.celebrationText}>🎊 Amazing! 🎊</Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
  },
  instructions: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statementsContainer: {
    gap: 12,
  },
  statementCard: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  lieCard: {
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  selectedStatement: {
    borderColor: '#3498DB',
    backgroundColor: isDarkMode ? '#1e3a5f' : '#e8f4ff',
  },
  revealedLie: {
    borderColor: '#E74C3C',
    backgroundColor: isDarkMode ? '#3d1f1f' : '#ffe8e8',
  },
  wrongGuess: {
    borderColor: '#FFA500',
    backgroundColor: isDarkMode ? '#3d2f1f' : '#fff3e0',
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#888' : '#666',
    textTransform: 'uppercase',
  },
  lieTag: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lieTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  resultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  truthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
  truthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statementInput: {
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#333',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  statementText: {
    fontSize: 16,
    color: isDarkMode ? '#ccc' : '#555',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDarkMode ? '#666' : '#999',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#888' : '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  resultContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resultMessage: {
    fontSize: 18,
    fontWeight: '600',
  },
  correctMessage: {
    color: '#4CAF50',
  },
  incorrectMessage: {
    color: '#FFA500',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -30 }],
    backgroundColor: isDarkMode ? '#333' : '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
});