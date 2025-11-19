"use client";

import { useEffect, useState } from "react";
import { db } from "../../offline/db";

export default function ExamPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    db.questions.toArray().then(setQuestions);
  }, []);

  function answerQuestion(id, ans) {
    setAnswers({...answers, [id]: ans});
    db.submissions.put({ questionId: id, answer: ans });
  }

  return (
    <div className="p-4">
      <h2>Exam (Offline)</h2>

      {questions.map((q, idx) => (
        <div key={q.id} className="p-2 border mb-3">
          <strong>{idx + 1}. {q.question}</strong>
          {["a","b","c","d"].map(letter => (
            <div key={letter}>
              <button onClick={() => answerQuestion(q.id, letter.toUpperCase())}>
                {q[`option_${letter}`]}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
