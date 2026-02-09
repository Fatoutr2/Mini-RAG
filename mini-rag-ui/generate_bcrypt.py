from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

if __name__ == "__main__":
    pwd = input("Mot de passe à hasher : ")
    hashed = hash_password(pwd)
    print("\nHash bcrypt :")
    print(hashed)
