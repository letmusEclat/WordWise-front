Resumen y estructura del proyecto
Descripción breve: Proyecto para el análisis y predicción de precios de alojamientos de Airbnb en Estados Unidos durante temporadas vacacionales. Integra limpieza con Polars, procesamiento y modelado distribuido con Spark, almacenamiento en HDFS, orquestación con Airflow y registro de experimentos con Weights & Biases.

Archivos principales

data_cleaning.py — Limpieza y preparación inicial con Polars. Genera CSV y Parquet limpios.

spark_eda.py — Análisis exploratorio distribuido con PySpark; guarda agregados y reportes.

train_models.py — Entrenamiento y evaluación con Spark ML (Linear Regression y Random Forest).

airbnb_pipeline_dag_etesi.py — DAG de Airflow que orquesta todo el pipeline.

data/ — Carpeta sugerida para datos locales (raw y limpios).

notebooks/ — Visualizaciones y pruebas interactivas (opcional).

docs/ — Documentación adicional y resultados exportados.

Requisitos e instalación
Requisitos de software

Python 3.8 o superior.

Hadoop con HDFS accesible.

Apache Spark (cluster o modo local).

Apache Airflow (scheduler y webserver).

Cuenta en Weights & Biases (opcional para tracking).

Dependencias Python recomendadas

polars, pyspark, pandas, matplotlib, seaborn, wandb, apache-airflow.

Instalación rápida

Clonar el repositorio:

bash
git clone <URL-del-repositorio>
cd <nombre-del-repositorio>
Crear entorno virtual e instalar dependencias:

bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
Configurar acceso a HDFS y Spark según su instalación (variables de entorno o archivos de configuración).

Uso paso a paso
A continuación se describen las etapas principales del pipeline y comandos de ejemplo para ejecutarlas.

1. Limpieza de datos con Polars
Qué hace: selecciona variables relevantes, limpia precios, crea variables de temporada y antigüedad de reseñas, imputa faltantes y elimina outliers. Ejecutar ejemplo:

bash
python data_cleaning.py --input data/airbnb_raw.csv --output data/airbnb_clean.csv --parquet data/airbnb_clean.parquet
Salida: airbnb_clean.csv y airbnb_clean.parquet.

2. Subir datos a HDFS
Crear carpetas en HDFS:

bash
hdfs dfs -mkdir -p /user/hadoop/data/airbnb/data/clean
hdfs dfs -mkdir -p /user/hadoop/data/airbnb/results
hdfs dfs -mkdir -p /user/hadoop/data/airbnb/models
Subir archivo limpio:

bash
hdfs dfs -put data/airbnb_clean.csv /user/hadoop/data/airbnb/data/clean/
3. Análisis exploratorio con Spark
Qué hace: calcula estadísticas por ciudad, tipo de habitación, correlaciones y guarda agregados. Ejecutar ejemplo:

bash
spark-submit --master yarn --deploy-mode cluster spark_eda.py \
  --input hdfs:///user/hadoop/data/airbnb/data/clean/airbnb_clean.csv \
  --output hdfs:///user/hadoop/data/airbnb/results/eda/
4. Entrenamiento de modelos con Spark ML
Qué hace: transforma variables categóricas, entrena Linear Regression y Random Forest, evalúa y guarda el mejor modelo. Ejecutar ejemplo:

bash
spark-submit --master yarn --deploy-mode cluster train_models.py \
  --input hdfs:///user/hadoop/data/airbnb/data/clean/airbnb_clean.csv \
  --models_out hdfs:///user/hadoop/data/airbnb/models/ \
  --results_out hdfs:///user/hadoop/data/airbnb/results/models/
5. Orquestación con Airflow
Instalar DAG: copiar airbnb_pipeline_dag_etesi.py a la carpeta de DAGs de Airflow. Iniciar servicios (si aplica):

bash
airflow scheduler &
airflow webserver --port 8080 &
Activar y ejecutar el DAG desde la interfaz web de Airflow.

6. Registro de experimentos con Weights & Biases
Configurar: exportar WANDB_API_KEY o ejecutar wandb login. Ver resultados: ingresar al proyecto configurado en W&B para revisar métricas y comparativas.

Resultados clave y recomendaciones
Resultados principales

Modelo recomendado: Random Forest.

Métricas de referencia: RMSE ≈ 54.20 USD, R2 ≈ 0.586, MAE ≈ 38.23 USD.

Variables más influyentes: bedrooms, room_type, cleaning_fee, accommodates.

Recomendaciones prácticas

Implementar ingeniería geoespacial (KNN por latitud/longitud) para micro-segmentación.

Incorporar variables externas (eventos locales, demanda estacional por ciudad).

Mantener y versionar los datos originales para auditoría y reproducibilidad.

Probar el pipeline con una muestra local antes de ejecutar en el clúster.

Buenas prácticas y contacto
Buenas prácticas

Versionar scripts y parámetros de entrenamiento.

Mantener copia inalterada de los datos crudos.

Revisar permisos de HDFS antes de operaciones de lectura/escritura.

Ajustar particionado y memoria en Spark según el tamaño del dataset.

Autores y contacto


Autores: Karen Castañeda, Kevin Gallardo, Sergio Martinez

Docente: David Edmundo Romo Bucheli

Institución: Universidad Industrial de Santander

Notas finales

Antes de ejecutar en producción, validar el pipeline en un entorno de pruebas.

Revisar y adaptar requirements.txt a las versiones disponibles en su infraestructura.