1. GET 및 PUT 요청 처리하는 최신 방식 API 라우트
pages/api/users/[id].ts
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET 요청을 처리하는 함수
export async function GET(req, { params }) {
  const { id } = params; // URL 파라미터에서 id를 가져옵니다.
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch user' }), { status: 500 });
  }
}

// PUT 요청을 처리하는 함수
export async function PUT(req, { params }) {
  const { id } = params; // URL 파라미터에서 id를 가져옵니다.
  const { name, email } = await req.json(); // 요청 본문에서 name과 email을 가져옵니다.

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email },
    });

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update user' }), { status: 500 });
  }
}
```


pages/index.tsx (UI 구현)
```typescript
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

const Home = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users'); // 모든 사용자 목록 가져오기
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 수정된 값 처리
  const handleChange = (id: number, field: string, value: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, [field]: value } : user
      )
    );
  };

  // 사용자 업데이트 요청
  const handleSave = async (id: number, updatedUser: User) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) throw new Error('Failed to update user');
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? updated : user))
      );
      alert('User updated successfully');
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Edit Users</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) =>
                    handleChange(user.id, 'name', e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={user.email}
                  onChange={(e) =>
                    handleChange(user.id, 'email', e.target.value)
                  }
                />
              </td>
              <td>
                <button onClick={() => handleSave(user.id, user)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;```
