from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    SECRET_KEY: str = "change-this-secret-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "sqlite:///./school_cbt.db"
    PASSWORD_SALT_ROUNDS: int = 12

    model_config = ConfigDict(env_file=".env")

settings = Settings()
