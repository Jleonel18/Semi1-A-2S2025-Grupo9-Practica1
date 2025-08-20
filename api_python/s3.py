import boto3
import os
from botocore.exceptions import ClientError
import base64

# Inicializar cliente de S3 usando variables de entorno
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

def upload_image_base64(base64_string: str, filename: str) -> str:
    """
    Sube una imagen en base64 a S3 y devuelve la URL o path
    """
    try:
        # Convertir base64 a bytes
        image_bytes = base64.b64decode(base64_string)

        content_type = "image/jpeg"  # 'image/jpeg' o 'image/png'
        # Subir al bucket
        s3_client.put_object(Bucket=BUCKET_NAME, Key=filename, Body=image_bytes, ContentType=content_type)
        # Retornar la ruta pública
        url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{filename}"
        return url
    except ClientError as e:
        print(e)
        return None
