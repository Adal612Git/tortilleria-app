import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuthStore } from '../../store/authStore';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../../core/utils/encryption';
import { UserValidator } from '../../../domain/entities/User';

export default function UserManagementScreen() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin'|'empleado'|'repartidor'>('empleado');
  const [isActive, setIsActive] = useState(true);

  const repo = new UserRepository();

  const load = async () => {
    setLoading(true);
    try {
      const list = await repo.getAllUsers();
      setUsers(list);
    } catch (e: any) {
      Alert.alert('Usuarios', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('empleado');
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setIsActive(!!u.isActive);
    setFormOpen(true);
  };

  const save = async () => {
    const partial = { name, email, password: password || undefined, role, isActive };
    const valid = UserValidator.validate({ name, email, password: password || 'placeholder', role });
    if (!editing && !password) {
      Alert.alert('Validación', 'La contraseña es requerida');
      return;
    }
    if (!valid.isValid) {
      Alert.alert('Validación', valid.errors.join('\n'));
      return;
    }
    try {
      if (editing) {
        const updates: any = { name, email, role, isActive };
        if (password) updates.password = await EncryptionService.hashPassword(password);
        await repo.updateUser(editing.id!, updates);
      } else {
        const hashed = await EncryptionService.hashPassword(password);
        await repo.createUser({ name, email, password: hashed, role, isActive });
      }
      setFormOpen(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const remove = async (u: any) => {
    if (u.id === currentUser?.id) {
      Alert.alert('Usuarios', 'No puedes eliminar tu propio usuario');
      return;
    }
    Alert.alert('Eliminar', `Eliminar a ${u.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await repo.deleteUser(u.id); await load(); } catch(e: any){ Alert.alert('Error', e.message); }
      } }
    ]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'empleado': return 'bg-blue-500';
      case 'repartidor': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'empleado': return 'Empleado';
      case 'repartidor': return 'Repartidor';
      default: return role;
    }
  };

  const currentUserId = currentUser?.id ?? -1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <Text style={styles.headerSubtitle}>Administra empleados y repartidores</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={openCreate}>
          <Text style={styles.primaryButtonText}>+ Crear Usuario</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {users.map((user) => (
          <Swipeable
            key={user.id}
            renderRightActions={() => (
              <View style={styles.swipeActions}>
                {user.id !== currentUserId && (
                  <TouchableOpacity style={[styles.swipeButton, styles.swipeDelete]} onPress={() => remove(user)}>
                    <Text style={styles.swipeButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.swipeButton, styles.swipeEdit]} onPress={() => openEdit(user)}>
                  <Text style={styles.swipeButtonText}>Editar</Text>
                </TouchableOpacity>
              </View>
            )}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {user.name}
                    {user.id === currentUserId ? <Text style={styles.youText}> (Tú)</Text> : null}
                  </Text>
                  <Text style={styles.cardSubtitle}>{user.email}</Text>
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, { backgroundColor: roleBg(user.role) }]}>
                      <Text style={styles.tagText}>{getRoleText(user.role)}</Text>
                    </View>
                    <View style={[styles.tag, user.isActive ? styles.activeTag : styles.inactiveTag]}>
                      <Text style={[styles.tagText, user.isActive ? styles.activeTagText : styles.inactiveTagText]}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Swipeable>
        ))}
      </ScrollView>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Editar usuario' : 'Crear usuario'}</Text>
            <View style={styles.formBlock}>
              <Text style={styles.formLabel}>Nombre</Text>
              <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="Nombre" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formBlock}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput style={styles.formInput} value={email} onChangeText={setEmail} placeholder="email@dominio.com" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address" />
            </View>
            <View style={styles.formBlock}>
              <Text style={styles.formLabel}>Contraseña {editing ? '(dejar vacío para no cambiar)' : ''}</Text>
              <TextInput style={styles.formInput} value={password} onChangeText={setPassword} placeholder="••••••" placeholderTextColor="#9CA3AF" secureTextEntry />
            </View>
            <View style={[styles.formBlock, { flexDirection: 'row' }]}>
              {(['admin','empleado','repartidor'] as const).map(r => (
                <TouchableOpacity key={r} style={[styles.roleChip, role===r? styles.roleChipActive: styles.roleChipInactive]} onPress={() => setRole(r)}>
                  <Text style={role===r? styles.roleChipTextActive: styles.roleChipTextInactive}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.formBlock, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={styles.formLabel}>Activo</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setFormOpen(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSave]} onPress={save}>
                <Text style={styles.modalBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const roleBg = (role: string) => {
  switch (role) {
    case 'admin':
      return '#EDE7F6';
    case 'empleado':
      return '#E3F2FD';
    case 'repartidor':
      return '#E8F5E9';
    default:
      return '#E0E0E0';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: '#6B7280' },
  actionsRow: { paddingHorizontal: 16, paddingVertical: 12 },
  primaryButton: { backgroundColor: '#1D4ED8', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  swipeActions: { flexDirection: 'row', alignItems: 'stretch' },
  swipeButton: { justifyContent: 'center', paddingHorizontal: 16 },
  swipeDelete: { backgroundColor: '#EF4444' },
  swipeEdit: { backgroundColor: '#3B82F6' },
  swipeButtonText: { color: 'white', fontWeight: '600' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  youText: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
  cardSubtitle: { marginTop: 4, fontSize: 12, color: '#6B7280' },
  tagsRow: { flexDirection: 'row', marginTop: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginRight: 8 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  activeTag: { backgroundColor: '#DCFCE7' },
  inactiveTag: { backgroundColor: '#FEE2E2' },
  activeTagText: { color: '#166534' },
  inactiveTagText: { color: '#991B1B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  formBlock: { marginBottom: 10 },
  formLabel: { color: '#374151', marginBottom: 6 },
  formInput: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#111827' },
  roleChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  roleChipActive: { backgroundColor: '#1D4ED8' },
  roleChipInactive: { backgroundColor: '#E5E7EB' },
  roleChipTextActive: { color: 'white', fontWeight: '700' },
  roleChipTextInactive: { color: '#111827', fontWeight: '600' },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancel: { backgroundColor: '#9CA3AF', marginRight: 8 },
  modalSave: { backgroundColor: '#10B981' },
  modalBtnText: { color: 'white', fontWeight: '700' },
});
