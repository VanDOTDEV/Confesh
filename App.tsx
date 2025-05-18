import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, TextInput, Modal, Button, Alert } from 'react-native';
import { db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, auth, GoogleAuthProvider, signInWithPopup, signOut } from '../confession-react-native/firebase';
import { Confession } from '../confession-react-native/types';

const App = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newConfession, setNewConfession] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingConfession, setEditingConfession] = useState<Confession | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);

  // Fetch confessions with error handling
  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'confessions'));
      const confessionsData: Confession[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        confessionsData.push({ 
          id: doc.id, 
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          isAnonymous: data.isAnonymous || false,
          author: data.author || 'Unknown',
          authorId: data.authorId
        });
      });
      setConfessions(confessionsData);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      Alert.alert('Error', 'Failed to load confessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchConfessions();
      }
    });
    return unsubscribe;
  }, []);

  // Add new confession with improved error handling
  const handleAddConfession = async () => {
    if (!newConfession.trim()) {
      Alert.alert('Error', 'Confession cannot be empty');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be signed in to post');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'confessions'), {
        content: newConfession,
        createdAt: new Date(),
        isAnonymous,
        author: isAnonymous ? 'Anonymous' : user.displayName || 'User',
        authorId: user.uid
      });
      setNewConfession('');
      setIsAnonymous(false);
      await fetchConfessions();
    } catch (error) {
      console.error('Error adding confession:', error);
      Alert.alert('Error', 'Failed to add confession');
    } finally {
      setLoading(false);
    }
  };

  // Update confession with proper error handling
  const handleUpdateConfession = async () => {
    if (!editingConfession?.id) return;

    try {
      setLoading(true);
      const confessionRef = doc(db, 'confessions', editingConfession.id);
      await updateDoc(confessionRef, {
        content: editingConfession.content,
        updatedAt: new Date()
      });
      setEditingConfession(null);
      await fetchConfessions();
    } catch (error) {
      console.error('Error updating confession:', error);
      Alert.alert('Error', 'Failed to update confession');
    } finally {
      setLoading(false);
    }
  };

  // Delete confession with confirmation dialog
  const handleDeleteConfession = async (id: string) => {
    Alert.alert(
      'Delete Confession',
      'Are you sure you want to delete this confession?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, 'confessions', id));
              await fetchConfessions();
            } catch (error) {
              console.error('Error deleting confession:', error);
              Alert.alert('Error', 'Failed to delete confession');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HCDC CONFESH WALL</Text>

      {user ? (
        <View style={styles.userContainer}>
          <Text>Welcome, {user.displayName || 'User'}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={signInWithGoogle}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>
      )}

      {user && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write your confession..."
            value={newConfession}
            onChangeText={setNewConfession}
            multiline
            editable={!loading}
          />
          <View style={styles.anonymousContainer}>
            <Text>Post anonymously:</Text>
            <Button
              title={isAnonymous ? "Yes" : "No"}
              onPress={() => setIsAnonymous(!isAnonymous)}
              disabled={loading}
            />
          </View>
          <Button 
            title={loading ? 'Submitting...' : 'Submit Confession'} 
            onPress={handleAddConfession}
            disabled={loading || !newConfession.trim()}
          />
        </View>
      )}

      {loading && confessions.length === 0 ? (
        <Text style={styles.loadingText}>Loading confessions...</Text>
      ) : (
        <FlatList
          data={confessions}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <View style={styles.confessionItem}>
              <Text style={styles.confessionContent}>{item.content}</Text>
              <Text style={styles.confessionAuthor}>
                {item.isAnonymous ? 'Anonymous' : item.author}
              </Text>
              <Text style={styles.confessionDate}>
                {item.createdAt.toLocaleString()}
              </Text>
              {user?.uid === item.authorId && (
                <View style={styles.actions}>
                  <Button
                    title="Edit"
                    onPress={() => setEditingConfession(item)}
                    disabled={loading}
                  />
                  <Button
                    title="Delete"
                    onPress={() => handleDeleteConfession(item.id!)}
                    color="red"
                    disabled={loading}
                  />
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No confessions yet. Be the first to share!</Text>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={!!editingConfession} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Confession</Text>
          <TextInput
            style={styles.input}
            value={editingConfession?.content || ''}
            onChangeText={(text) => editingConfession && setEditingConfession({ ...editingConfession, content: text })}
            multiline
            editable={!loading}
          />
          <Button 
            title={loading ? 'Saving...' : 'Save Changes'} 
            onPress={handleUpdateConfession}
            disabled={loading || !editingConfession?.content.trim()}
          />
          <Button 
            title="Cancel" 
            onPress={() => setEditingConfession(null)}
            disabled={loading}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e9e9e9',
    borderRadius: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    minHeight: 100,
    backgroundColor: 'white',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 5,
  },
  confessionItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  confessionContent: {
    fontSize: 16,
    marginBottom: 5,
  },
  confessionAuthor: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  confessionDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutText: {
    color: 'white',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default App;