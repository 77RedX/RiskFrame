import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset

from model import TemporalCNN
from dataset import PortfolioDataset, CONFIG, download_and_prepare_data


def train():
    # 1. Setup Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("--- Starting Training ---", flush=True)
    print(f"Using Device: {device}\n", flush=True)

    # 2. Ensure Data is Downloaded & Ready
    print("Checking / Downloading Dataset...", flush=True)
    download_and_prepare_data(CONFIG)

    # 3. Hyperparameters
    batch_size = 32
    learning_rate = 0.001
    num_epochs = 150
    early_stopping_patience = 20

    # 4. Load Dataset & Split Chronologically (80% Train, 20% Validation)
    print("Loading Dataset and splitting chronologically...", flush=True)
    full_dataset = PortfolioDataset(config=CONFIG)

    dataset_size = len(full_dataset)
    train_size = int(dataset_size * 0.8)
    val_size = dataset_size - train_size

    # Split sequentially: earliest 80% for train, latest 20% for validation (no shuffle across time)
    train_indices = list(range(0, train_size))
    val_indices = list(range(train_size, dataset_size))

    train_dataset = Subset(full_dataset, train_indices)
    val_dataset = Subset(full_dataset, val_indices)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    print(f"Total trading days available: {dataset_size}", flush=True)
    print(f"  -> Training sample size  : {len(train_dataset)} days (earliest 80%)", flush=True)
    print(f"  -> Validation sample size: {len(val_dataset)} days (latest 20%)", flush=True)
    print(f"Number of assets: {full_dataset.num_assets}", flush=True)
    print(f"Features per asset: {full_dataset.features_per_asset}\n", flush=True)

    # 5. Initialize Model, Loss Function, and Optimizer
    print("Initializing Model...", flush=True)
    model = TemporalCNN(
        num_assets=full_dataset.num_assets,
        features_per_asset=full_dataset.features_per_asset,
        hidden_channels=CONFIG["HIDDEN_CHANNELS"],
        dropout=CONFIG["DROPOUT"],
    ).to(device)

    criterion = nn.HuberLoss()
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=5, min_lr=1e-6
    )

    # 6. Training Loop with Validation and Early Stopping
    print("\nStarting Epochs...", flush=True)
    best_val_loss = float('inf')
    patience_counter = 0
    save_path = CONFIG["MODEL_PATH"]

    for epoch in range(num_epochs):
        # --- TRAINING PHASE ---
        model.train()
        running_train_loss = 0.0

        for batch_idx, (features, targets) in enumerate(train_loader):
            features = features.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            predictions = model(features)
            loss = criterion(predictions, targets)
            loss.backward()

            # Gradient clipping to prevent gradient explosions / instability across batches
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            optimizer.step()
            running_train_loss += loss.item()

        avg_train_loss = running_train_loss / len(train_loader)

        # --- VALIDATION PHASE ---
        model.eval()
        running_val_loss = 0.0

        with torch.no_grad():
            for features, targets in val_loader:
                features = features.to(device)
                targets = targets.to(device)

                predictions = model(features)
                val_loss = criterion(predictions, targets)
                running_val_loss += val_loss.item()

        avg_val_loss = running_val_loss / len(val_loader)

        # Step learning rate scheduler based on Validation Loss
        scheduler.step(avg_val_loss)

        # Checkpoint if validation loss improved
        is_best = avg_val_loss < best_val_loss
        if is_best:
            best_val_loss = avg_val_loss
            patience_counter = 0
            torch.save(model.state_dict(), save_path)
            status_msg = f"-> New best model saved to '{save_path}'"
        else:
            patience_counter += 1
            status_msg = f"(Patience: {patience_counter}/{early_stopping_patience})"

        if (epoch + 1) == 1 or (epoch + 1) % 5 == 0 or is_best:
            current_lr = optimizer.param_groups[0]['lr']
            print(f"Epoch [{epoch+1:03d}/{num_epochs}] | Train Loss: {avg_train_loss:.6f} | Val Loss: {avg_val_loss:.6f} | LR: {current_lr:.6f} {status_msg}", flush=True)

        if patience_counter >= early_stopping_patience:
            print(f"\n[Early Stopping] Validation loss did not improve for {early_stopping_patience} consecutive epochs. Stopping early to prevent overfitting.", flush=True)
            break

    print(f"\nTraining finished! Best Validation Loss achieved: {best_val_loss:.6f}", flush=True)
    print(f"Best model weights are saved at '{save_path}'.", flush=True)

    # 7. Upload to Hugging Face Hub
    hf_token = os.environ.get("HF_TOKEN")
    hf_repo = CONFIG.get("HF_MODEL_REPO")
    
    if hf_token and hf_repo:
        print(f"\nUploading model to Hugging Face Hub repository: {hf_repo}...")
        try:
            from huggingface_hub import HfApi
            api = HfApi()
            api.upload_file(
                path_or_fileobj=save_path,
                path_in_repo=save_path,
                repo_id=hf_repo,
                token=hf_token,
                repo_type="model"
            )
            print("Successfully uploaded model weights to Hugging Face Hub!")
        except Exception as e:
            print(f"Failed to upload to Hugging Face Hub: {e}", file=sys.stderr)
    else:
        print("\nSkipping Hugging Face Hub upload. HF_TOKEN or HF_MODEL_REPO environment variables not set.")

if __name__ == "__main__":
    train()