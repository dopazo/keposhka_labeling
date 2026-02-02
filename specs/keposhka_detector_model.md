# Keposhka Detector Model

Especificación técnica para entrenar un modelo YOLO v11 que detecte y clasifique caracteres del lenguaje ficticio Keposhka en imágenes.

## Objetivo

Crear un modelo de detección de objetos capaz de:
1. Localizar caracteres Keposhka en una imagen (bounding boxes)
2. Clasificar cada carácter detectado entre 70 clases posibles
3. Funcionar con imágenes de diferentes resoluciones y estilos

## Stack Tecnológico

- **Framework ML**: Ultralytics YOLO v11
- **Backend**: PyTorch
- **Python**: 3.10+
- **Gestión de dependencias**: `uv`

## Clases (70 total)

IDs 0-69, mapeados desde `classes.txt`:

| ID | Label | ID | Label | ID | Label | ID | Label |
|----|-------|----|---------|----|-------|---------|-------|
|  0 | 0     | 18 | D       | 36 | L     | 54 | T     |
|  1 | 1     | 19 | d       | 37 | l     | 55 | t     |
|  2 | 2     | 20 | E       | 38 | M     | 56 | TH    |
|  3 | 3     | 21 | e       | 39 | m     | 57 | th    |
|  4 | 4     | 22 | F       | 40 | N     | 58 | U     |
|  5 | 5     | 23 | f       | 41 | n     | 59 | u     |
|  6 | 6     | 24 | G       | 42 | O     | 60 | V     |
|  7 | 7     | 25 | g       | 43 | o     | 61 | v     |
|  8 | 8     | 26 | GH      | 44 | P     | 62 | W     |
|  9 | 9     | 27 | gh      | 45 | p     | 63 | w     |
| 10 | A     | 28 | H       | 46 | Q     | 64 | X     |
| 11 | a     | 29 | h       | 47 | q     | 65 | x     |
| 12 | B     | 30 | I       | 48 | R     | 66 | Y     |
| 13 | b     | 31 | i       | 49 | r     | 67 | y     |
| 14 | C     | 32 | J       | 50 | S     | 68 | Z     |
| 15 | c     | 33 | j       | 51 | s     | 69 | z     |
| 16 | CH    | 34 | K       | 52 | SH    |    |       |
| 17 | ch    | 35 | k       | 53 | sh    |    |       |

## Estructura del Proyecto

```
keposhka_detector/
├── data/
│   ├── images/              # Todas las imágenes (.jpg, .jpeg, .png)
│   ├── labels/              # Anotaciones YOLO (.txt, mismo nombre que imagen)
│   └── classes.txt          # Lista de clases (una por línea)
│
├── folds/                   # Generado por prepare_folds.py
│   ├── fold_0/
│   │   ├── train/
│   │   │   ├── images/      # Symlinks o copias
│   │   │   └── labels/
│   │   └── val/
│   │       ├── images/
│   │       └── labels/
│   ├── fold_1/
│   ├── fold_2/
│   ├── fold_3/
│   └── fold_4/
│
├── configs/
│   ├── data_template.yaml   # Template para data.yaml
│   └── train_config.yaml    # Hiperparámetros de entrenamiento
│
├── scripts/
│   ├── prepare_folds.py     # Crea estructura k-fold
│   ├── train.py             # Entrena un fold o todos
│   ├── evaluate.py          # Evalúa modelo(s) entrenado(s)
│   └── predict.py           # Inferencia en nuevas imágenes
│
├── runs/                    # Generado por Ultralytics (pesos, logs, métricas)
│
├── pyproject.toml
└── README.md
```

## Formato de Datos

### Imágenes
- Formatos soportados: `.jpg`, `.jpeg`, `.png`
- Resolución variable (YOLO redimensiona automáticamente)

### Anotaciones YOLO (labels/*.txt)
Cada línea representa un bounding box:
```
<class_id> <x_center> <y_center> <width> <height>
```
- Todos los valores normalizados entre 0 y 1
- `x_center`, `y_center`: centro del box relativo al tamaño de imagen
- `width`, `height`: dimensiones del box relativas al tamaño de imagen

### classes.txt
```
0
1
2
...
z
```
Una clase por línea, en orden de class_id (0-69).

## K-Fold Cross Validation

### Configuración
- **k = 5** folds
- División estratificada por imagen (no por anotación)
- Seed fijo para reproducibilidad

### Proceso
1. Listar todas las imágenes con anotaciones válidas
2. Shuffle con seed fijo
3. Dividir en 5 particiones iguales
4. Para cada fold i:
   - Validación: partición i
   - Entrenamiento: particiones restantes (j != i)

### Script: prepare_folds.py

```python
"""
Prepara la estructura de directorios para k-fold cross validation.

Uso:
    uv run python scripts/prepare_folds.py

Genera:
    folds/fold_{0-4}/train/images/
    folds/fold_{0-4}/train/labels/
    folds/fold_{0-4}/val/images/
    folds/fold_{0-4}/val/labels/
    folds/fold_{0-4}/data.yaml
"""

import os
import shutil
import random
from pathlib import Path

# Configuración
K = 5
SEED = 42
DATA_DIR = Path("data")
FOLDS_DIR = Path("folds")
USE_SYMLINKS = True  # False para copiar archivos

def main():
    # Obtener lista de imágenes con anotaciones
    images_dir = DATA_DIR / "images"
    labels_dir = DATA_DIR / "labels"

    image_files = []
    for ext in ["*.jpg", "*.jpeg", "*.png"]:
        image_files.extend(images_dir.glob(ext))

    # Filtrar solo imágenes con anotación correspondiente
    valid_pairs = []
    for img_path in image_files:
        label_path = labels_dir / f"{img_path.stem}.txt"
        if label_path.exists():
            valid_pairs.append((img_path, label_path))

    print(f"Encontradas {len(valid_pairs)} imágenes con anotaciones")

    # Shuffle determinístico
    random.seed(SEED)
    random.shuffle(valid_pairs)

    # Dividir en k particiones
    fold_size = len(valid_pairs) // K
    partitions = []
    for i in range(K):
        start = i * fold_size
        end = start + fold_size if i < K - 1 else len(valid_pairs)
        partitions.append(valid_pairs[start:end])

    # Crear estructura de folds
    for fold_idx in range(K):
        fold_dir = FOLDS_DIR / f"fold_{fold_idx}"

        # Limpiar si existe
        if fold_dir.exists():
            shutil.rmtree(fold_dir)

        # Crear directorios
        for split in ["train", "val"]:
            (fold_dir / split / "images").mkdir(parents=True)
            (fold_dir / split / "labels").mkdir(parents=True)

        # Validación = partición actual
        val_pairs = partitions[fold_idx]
        # Entrenamiento = resto
        train_pairs = []
        for j in range(K):
            if j != fold_idx:
                train_pairs.extend(partitions[j])

        # Crear links/copias
        for split, pairs in [("train", train_pairs), ("val", val_pairs)]:
            for img_path, label_path in pairs:
                img_dest = fold_dir / split / "images" / img_path.name
                label_dest = fold_dir / split / "labels" / label_path.name

                if USE_SYMLINKS:
                    img_dest.symlink_to(img_path.resolve())
                    label_dest.symlink_to(label_path.resolve())
                else:
                    shutil.copy2(img_path, img_dest)
                    shutil.copy2(label_path, label_dest)

        # Crear data.yaml para este fold
        create_data_yaml(fold_dir, fold_idx)

        print(f"Fold {fold_idx}: {len(train_pairs)} train, {len(val_pairs)} val")

def create_data_yaml(fold_dir: Path, fold_idx: int):
    """Genera data.yaml para un fold específico."""
    classes = load_classes()

    yaml_content = f"""# YOLO Dataset Configuration - Fold {fold_idx}
path: {fold_dir.resolve()}
train: train/images
val: val/images

nc: {len(classes)}
names: {classes}
"""

    (fold_dir / "data.yaml").write_text(yaml_content)

def load_classes() -> list:
    """Carga lista de clases desde classes.txt"""
    classes_file = DATA_DIR / "classes.txt"
    return [line.strip() for line in classes_file.read_text().splitlines() if line.strip()]

if __name__ == "__main__":
    main()
```

## Configuración de Entrenamiento

### configs/train_config.yaml

```yaml
# Modelo base
model: yolo11n.pt  # Opciones: yolo11n/s/m/l/x

# Entrenamiento
epochs: 100
patience: 20          # Early stopping
batch: 16             # Ajustar según VRAM
imgsz: 640            # Tamaño de imagen

# Optimizador
optimizer: AdamW
lr0: 0.001            # Learning rate inicial
lrf: 0.01             # Learning rate final (lr0 * lrf)
momentum: 0.937
weight_decay: 0.0005

# Augmentation
hsv_h: 0.015          # Hue
hsv_s: 0.7            # Saturation
hsv_v: 0.4            # Value
degrees: 5.0          # Rotación
translate: 0.1
scale: 0.5
shear: 2.0
flipud: 0.0           # Sin flip vertical (texto)
fliplr: 0.0           # Sin flip horizontal (texto direccional)
mosaic: 0.5
mixup: 0.1

# Otros
workers: 8
device: 0             # GPU index, o 'cpu'
project: runs
exist_ok: true
verbose: true
```

### Script: train.py

```python
"""
Entrena modelo YOLO v11 con k-fold cross validation.

Uso:
    uv run python scripts/train.py                    # Entrena todos los folds
    uv run python scripts/train.py --fold 0          # Entrena solo fold 0
    uv run python scripts/train.py --config custom.yaml
"""

import argparse
import yaml
from pathlib import Path
from ultralytics import YOLO

def load_config(config_path: str = "configs/train_config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)

def train_fold(fold_idx: int, config: dict):
    """Entrena un fold específico."""
    fold_dir = Path(f"folds/fold_{fold_idx}")
    data_yaml = fold_dir / "data.yaml"

    if not data_yaml.exists():
        raise FileNotFoundError(f"No existe {data_yaml}. Ejecuta prepare_folds.py primero.")

    # Cargar modelo base
    model = YOLO(config["model"])

    # Entrenar
    results = model.train(
        data=str(data_yaml),
        epochs=config["epochs"],
        patience=config["patience"],
        batch=config["batch"],
        imgsz=config["imgsz"],
        optimizer=config["optimizer"],
        lr0=config["lr0"],
        lrf=config["lrf"],
        momentum=config["momentum"],
        weight_decay=config["weight_decay"],
        hsv_h=config["hsv_h"],
        hsv_s=config["hsv_s"],
        hsv_v=config["hsv_v"],
        degrees=config["degrees"],
        translate=config["translate"],
        scale=config["scale"],
        shear=config["shear"],
        flipud=config["flipud"],
        fliplr=config["fliplr"],
        mosaic=config["mosaic"],
        mixup=config["mixup"],
        workers=config["workers"],
        device=config["device"],
        project=config["project"],
        name=f"fold_{fold_idx}",
        exist_ok=config["exist_ok"],
        verbose=config["verbose"],
    )

    return results

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=None, help="Fold específico (0-4)")
    parser.add_argument("--config", type=str, default="configs/train_config.yaml")
    args = parser.parse_args()

    config = load_config(args.config)

    if args.fold is not None:
        print(f"Entrenando fold {args.fold}")
        train_fold(args.fold, config)
    else:
        print("Entrenando todos los folds (k=5)")
        for fold_idx in range(5):
            print(f"\n{'='*50}")
            print(f"FOLD {fold_idx}")
            print(f"{'='*50}\n")
            train_fold(fold_idx, config)

if __name__ == "__main__":
    main()
```

### Script: evaluate.py

```python
"""
Evalúa modelos entrenados y genera reporte de métricas.

Uso:
    uv run python scripts/evaluate.py                 # Evalúa todos los folds
    uv run python scripts/evaluate.py --fold 0       # Evalúa solo fold 0
"""

import argparse
import json
from pathlib import Path
from ultralytics import YOLO
import numpy as np

def evaluate_fold(fold_idx: int) -> dict:
    """Evalúa el modelo de un fold en su conjunto de validación."""
    # Buscar el mejor modelo
    weights_path = Path(f"runs/fold_{fold_idx}/weights/best.pt")
    if not weights_path.exists():
        print(f"No se encontró modelo para fold {fold_idx}")
        return None

    data_yaml = Path(f"folds/fold_{fold_idx}/data.yaml")

    model = YOLO(weights_path)
    metrics = model.val(data=str(data_yaml), verbose=False)

    return {
        "fold": fold_idx,
        "mAP50": float(metrics.box.map50),
        "mAP50-95": float(metrics.box.map),
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fold", type=int, default=None)
    parser.add_argument("--output", type=str, default="evaluation_results.json")
    args = parser.parse_args()

    results = []

    if args.fold is not None:
        result = evaluate_fold(args.fold)
        if result:
            results.append(result)
    else:
        for fold_idx in range(5):
            result = evaluate_fold(fold_idx)
            if result:
                results.append(result)

    if not results:
        print("No hay resultados para evaluar")
        return

    # Calcular promedios
    avg_metrics = {
        "mAP50": np.mean([r["mAP50"] for r in results]),
        "mAP50-95": np.mean([r["mAP50-95"] for r in results]),
        "precision": np.mean([r["precision"] for r in results]),
        "recall": np.mean([r["recall"] for r in results]),
        "std_mAP50": np.std([r["mAP50"] for r in results]),
        "std_mAP50-95": np.std([r["mAP50-95"] for r in results]),
    }

    # Imprimir reporte
    print("\n" + "="*60)
    print("RESULTADOS K-FOLD CROSS VALIDATION")
    print("="*60)

    for r in results:
        print(f"\nFold {r['fold']}:")
        print(f"  mAP50:    {r['mAP50']:.4f}")
        print(f"  mAP50-95: {r['mAP50-95']:.4f}")
        print(f"  Precision: {r['precision']:.4f}")
        print(f"  Recall:    {r['recall']:.4f}")

    print(f"\n{'='*60}")
    print("PROMEDIO (± std):")
    print(f"  mAP50:    {avg_metrics['mAP50']:.4f} ± {avg_metrics['std_mAP50']:.4f}")
    print(f"  mAP50-95: {avg_metrics['mAP50-95']:.4f} ± {avg_metrics['std_mAP50-95']:.4f}")
    print(f"  Precision: {avg_metrics['precision']:.4f}")
    print(f"  Recall:    {avg_metrics['recall']:.4f}")

    # Guardar resultados
    output = {
        "folds": results,
        "average": avg_metrics,
    }

    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nResultados guardados en {args.output}")

if __name__ == "__main__":
    main()
```

### Script: predict.py

```python
"""
Realiza inferencia en nuevas imágenes.

Uso:
    uv run python scripts/predict.py image.jpg
    uv run python scripts/predict.py images_dir/
    uv run python scripts/predict.py image.jpg --model runs/fold_0/weights/best.pt
    uv run python scripts/predict.py image.jpg --conf 0.5 --save
"""

import argparse
from pathlib import Path
from ultralytics import YOLO

def find_best_model() -> Path:
    """Busca el mejor modelo disponible (por mAP del fold 0 por defecto)."""
    default = Path("runs/fold_0/weights/best.pt")
    if default.exists():
        return default

    # Buscar cualquier modelo disponible
    for fold in range(5):
        path = Path(f"runs/fold_{fold}/weights/best.pt")
        if path.exists():
            return path

    raise FileNotFoundError("No se encontró ningún modelo entrenado en runs/")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=str, help="Imagen o directorio")
    parser.add_argument("--model", type=str, default=None, help="Ruta al modelo .pt")
    parser.add_argument("--conf", type=float, default=0.25, help="Umbral de confianza")
    parser.add_argument("--iou", type=float, default=0.45, help="Umbral IoU para NMS")
    parser.add_argument("--save", action="store_true", help="Guardar imágenes con detecciones")
    parser.add_argument("--save-txt", action="store_true", help="Guardar anotaciones .txt")
    args = parser.parse_args()

    # Cargar modelo
    model_path = args.model if args.model else find_best_model()
    print(f"Usando modelo: {model_path}")
    model = YOLO(model_path)

    # Inferencia
    results = model.predict(
        source=args.source,
        conf=args.conf,
        iou=args.iou,
        save=args.save,
        save_txt=args.save_txt,
        verbose=True,
    )

    # Mostrar resultados
    for result in results:
        print(f"\n{result.path}:")
        if result.boxes:
            for box in result.boxes:
                cls_id = int(box.cls)
                conf = float(box.conf)
                label = model.names[cls_id]
                print(f"  {label}: {conf:.2f}")
        else:
            print("  No se detectaron caracteres")

if __name__ == "__main__":
    main()
```

## Dependencias

### pyproject.toml

```toml
[project]
name = "keposhka-detector"
version = "0.1.0"
description = "YOLO v11 model for Keposhka character detection"
requires-python = ">=3.10"
dependencies = [
    "ultralytics>=8.3.0",
    "torch>=2.0.0",
    "torchvision>=0.15.0",
    "numpy>=1.24.0",
    "pyyaml>=6.0",
    "opencv-python>=4.8.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "ruff>=0.1.0",
]

[tool.ruff]
line-length = 100
```

## Flujo de Trabajo

### 1. Preparación inicial

```bash
# Crear proyecto
mkdir keposhka_detector
cd keposhka_detector

# Inicializar con uv
uv init

# Instalar dependencias
uv sync
```

### 2. Agregar datos

Copiar desde el proyecto de labeling:
```bash
# Estructura esperada
cp -r ../keposhka_labeling/backend/data/images data/images
cp ../keposhka_labeling/backend/data/annotations/*.txt data/labels/
cp ../keposhka_labeling/backend/data/annotations/classes.txt data/
```

### 3. Preparar folds

```bash
uv run python scripts/prepare_folds.py
```

### 4. Entrenar

```bash
# Todos los folds
uv run python scripts/train.py

# O un fold específico
uv run python scripts/train.py --fold 0
```

### 5. Evaluar

```bash
uv run python scripts/evaluate.py
```

### 6. Inferencia

```bash
uv run python scripts/predict.py nueva_imagen.jpg --save
```

## Métricas Esperadas

Con suficientes datos anotados (100+ imágenes), se esperan métricas aproximadas:

| Métrica | Objetivo |
|---------|----------|
| mAP50 | > 0.85 |
| mAP50-95 | > 0.60 |
| Precision | > 0.80 |
| Recall | > 0.80 |

## Consideraciones

### Desbalance de clases
- Algunas clases (vocales, letras comunes) tendrán más ejemplos
- Considerar focal loss o class weights si hay desbalance severo

### Data Augmentation
- **Deshabilitado flip**: El texto Keposhka es direccional
- **Rotación limitada**: Solo ±5° para simular fotos ligeramente torcidas
- **Mosaic reducido**: 0.5 para mantener contexto de caracteres

### Tamaño del modelo
- `yolo11n`: Más rápido, menos preciso (recomendado para empezar)
- `yolo11s/m`: Balance velocidad/precisión
- `yolo11l/x`: Mayor precisión, más lento

### GPU
- Mínimo: 4GB VRAM (batch=8, imgsz=640)
- Recomendado: 8GB+ VRAM (batch=16+)
