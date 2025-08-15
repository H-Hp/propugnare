// src/components/ContactModal.jsx
import React, { useState } from 'react';

const ContactModal = ({ onClose }) => {
  const [form, setForm] = useState({ message: '' });
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute('content');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ contact: form }),
      });

      if (!res.ok) {
        throw new Error(`エラー: ${res.status}`);
      }

      // 成功時：閉じる or フォーム初期化
      onClose();
    } catch (err) {
      setError('送信に失敗しました。時間を置いて再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">お問合せフォーム</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">メッセージ</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              className="w-full border px-2 py-1 rounded h-24"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#dc143c] text-white py-2 rounded hover:bg-red-600"
          >
            {isSubmitting ? '送信中…' : '送信する'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
