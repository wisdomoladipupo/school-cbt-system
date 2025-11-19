import Dexie from "dexie";

export const db = new Dexie("cbt_offline_db");
db.version(1).stores({
  questions: "id, exam_id",
  submissions: "questionId, answer"
});
