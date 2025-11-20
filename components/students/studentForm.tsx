import React, { useState } from "react";
import { Student } from "./studentCard";

interface StudentFormProps {
  initial?: Partial<Student>;
  onSubmit: (student: Student) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({
  initial = {},
  onSubmit,
}) => {
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [className, setClassName] = useState(initial.className || "");
  const [regNumber, setRegNumber] = useState(initial.regNumber || "");
  const [passport, setPassport] = useState<string | undefined>(
    initial.passport
  );

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPassport(reader.result as string);
      reader.readAsDataURL(file); // convert to base64
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, className, regNumber, passport, id: initial.id });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded bg-white"
    >
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Class</label>
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full border rounded px-2 py-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Reg Number</label>
        <input
          value={regNumber}
          className="w-full border rounded px-2 py-1 bg-gray-100"
          readOnly
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Passport</label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePassportChange}
          className="w-full border rounded px-2 py-1"
        />
        {passport && (
          <img
            src={passport}
            alt="passport"
            className="mt-2 w-24 h-24 object-cover rounded-full"
          />
        )}
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Student
      </button>
    </form>
  );
};

export default StudentForm;
